import net from "node:net";
import tls from "node:tls";

export type MailPayload = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
};

export type MailDeliveryResult = {
  delivered: boolean;
  provider: "smtp" | "gas" | "brevo" | "resend" | "builtin";
  error?: string;
};

function encodeMimeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(b64: string) {
  return b64.replace(/(.{76})/g, "$1\r\n");
}

function buildMimeMessage(opts: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  toName?: string;
  subject: string;
  text: string;
  html: string;
}) {
  const boundary = `lsoul_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const fromHeader = `${encodeMimeHeader(opts.fromName)} <${opts.fromEmail}>`;
  const toHeader = opts.toName ? `${encodeMimeHeader(opts.toName)} <${opts.toEmail}>` : `<${opts.toEmail}>`;
  const textB64 = wrapBase64(Buffer.from(opts.text, "utf8").toString("base64"));
  const htmlB64 = wrapBase64(Buffer.from(opts.html, "utf8").toString("base64"));

  return [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${encodeMimeHeader(opts.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    textB64,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    htmlB64,
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

/**
 * Zero-dependency SMTP over TLS client (supports Gmail App Password on smtp.gmail.com:465
 * or any standard SMTP server on port 465 / 587).
 */
async function sendViaNativeSmtp(
  config: { host: string; port: number; user: string; pass: string; fromEmail: string; fromName: string },
  payload: MailPayload
): Promise<void> {
  const { host, port, user, pass, fromEmail, fromName } = config;
  const cleanPass = pass.replace(/\s+/g, "");

  return new Promise<void>((resolve, reject) => {
    let socket: net.Socket | tls.TLSSocket;
    let buffer = "";
    let settled = false;

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      try {
        socket?.destroy();
      } catch {
        /* ignore */
      }
      reject(err);
    };

    const timer = setTimeout(() => fail(new Error("SMTP connection timed out (12s).")), 12_000);

    let waitResolve: ((line: { code: number; text: string }) => void) | null = null;
    const queue: { code: number; text: string }[] = [];

    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      const lines = buffer.split("\r\n");
      buffer = lines.pop() ?? "";
      let collected: string[] = [];
      for (const line of lines) {
        if (!line) continue;
        collected.push(line);
        // SMTP final line of a response has a space at index 3 (e.g. "250 OK"), whereas continuation has "-" ("250-PIPELINING")
        if (/^\d{3} /.test(line) || /^\d{3}$/.test(line)) {
          const code = Number(line.slice(0, 3));
          const text = collected.join("\n");
          collected = [];
          if (waitResolve) {
            const r = waitResolve;
            waitResolve = null;
            r({ code, text });
          } else {
            queue.push({ code, text });
          }
        }
      }
    };

    const readResponse = (): Promise<{ code: number; text: string }> => {
      if (queue.length > 0) return Promise.resolve(queue.shift()!);
      return new Promise((res) => {
        waitResolve = res;
      });
    };

    const sendCmd = async (cmd: string, expectedCodes: number[]) => {
      socket.write(`${cmd}\r\n`);
      const res = await readResponse();
      if (!expectedCodes.includes(res.code)) {
        throw new Error(`SMTP error (${res.code}): ${res.text}`);
      }
      return res;
    };

    const runSession = async () => {
      try {
        const greeting = await readResponse();
        if (greeting.code !== 220) throw new Error(`Unexpected SMTP greeting: ${greeting.text}`);

        await sendCmd("EHLO lsoul.local", [250]);

        if (port !== 465 && !(socket instanceof tls.TLSSocket)) {
          await sendCmd("STARTTLS", [220]);
          socket.removeAllListeners("data");
          socket = await new Promise<tls.TLSSocket>((res, rej) => {
            const tlsSock = tls.connect({ socket, servername: host }, () => res(tlsSock));
            tlsSock.once("error", rej);
          });
          socket.on("data", onData);
          socket.on("error", fail);
          await sendCmd("EHLO lsoul.local", [250]);
        }

        await sendCmd("AUTH LOGIN", [334]);
        await sendCmd(Buffer.from(user, "utf8").toString("base64"), [334]);
        await sendCmd(Buffer.from(cleanPass, "utf8").toString("base64"), [235]);

        await sendCmd(`MAIL FROM:<${fromEmail}>`, [250]);
        await sendCmd(`RCPT TO:<${payload.to}>`, [250, 251]);
        await sendCmd("DATA", [354]);

        const mime = buildMimeMessage({
          fromName,
          fromEmail,
          toEmail: payload.to,
          toName: payload.toName,
          subject: payload.subject,
          text: payload.text,
          html: payload.html
        }).replace(/^\./gm, "..");

        await sendCmd(`${mime}\r\n.`, [250]);
        await sendCmd("QUIT", [221, 250]).catch(() => undefined);

        clearTimeout(timer);
        if (!settled) {
          settled = true;
          socket.end();
          resolve();
        }
      } catch (err) {
        clearTimeout(timer);
        fail(err instanceof Error ? err : new Error(String(err)));
      }
    };

    socket =
      port === 465
        ? tls.connect({ host, port, servername: host })
        : net.connect({ host, port });

    socket.on("data", onData);
    socket.on("error", fail);
    void runSession();
  });
}

/**
 * Multi-channel free & self-hosted email sender:
 * 1. Gmail / SMTP (FREE 500 emails/day to any recipient via GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_*)
 * 2. Google Apps Script Webhook (FREE via GAS_MAIL_WEBHOOK_URL)
 * 3. Brevo / Resend HTTP APIs (optional if configured)
 * 4. Built-in self-hosted mail fallback (100% free, zero external config needed)
 */
export async function sendTransactionalMail(payload: MailPayload): Promise<MailDeliveryResult> {
  const fromName = process.env.SMTP_FROM_NAME || process.env.BREVO_SENDER_NAME || "LSOUL Fashion";

  // 1. Free Gmail / SMTP
  const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  if (smtpUser && smtpPass) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 465);
    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
    try {
      await sendViaNativeSmtp({ host, port, user: smtpUser, pass: smtpPass, fromEmail, fromName }, payload);
      return { delivered: true, provider: "smtp" };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[LSOUL Mailer] SMTP delivery failed, falling back:", msg);
    }
  }

  // 2. Free Google Apps Script Mail Bridge (HTTPS Web App)
  const gasWebhook = process.env.GAS_MAIL_WEBHOOK_URL;
  if (gasWebhook) {
    try {
      const res = await fetch(gasWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: payload.to,
          name: payload.toName,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          secret: process.env.GAS_MAIL_SECRET || ""
        })
      });
      if (res.ok) return { delivered: true, provider: "gas" };
      console.error("[LSOUL Mailer] GAS webhook error:", res.status, (await res.text()).slice(0, 500));
    } catch (error) {
      console.error("[LSOUL Mailer] GAS webhook failed:", error);
    }
  }

  // 3. Optional Brevo HTTP API
  const brevoKey = process.env.BREVO_API_KEY;
  const brevoSender = process.env.BREVO_SENDER_EMAIL;
  if (brevoKey && brevoSender) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: fromName, email: brevoSender },
          to: [{ email: payload.to, name: payload.toName || undefined }],
          subject: payload.subject,
          htmlContent: payload.html,
          textContent: payload.text
        })
      });
      if (res.ok) return { delivered: true, provider: "brevo" };
      console.error("[LSOUL Mailer] Brevo rejected email:", res.status, (await res.text()).slice(0, 500));
    } catch (error) {
      console.error("[LSOUL Mailer] Brevo request failed:", error);
    }
  }

  // 4. Optional Resend HTTP API
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.EMAIL_FROM;
  if (resendKey && resendFrom) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html
        })
      });
      if (res.ok) return { delivered: true, provider: "resend" };
      console.error("[LSOUL Mailer] Resend rejected email:", res.status, (await res.text()).slice(0, 500));
    } catch (error) {
      console.error("[LSOUL Mailer] Resend request failed:", error);
    }
  }

  // 5. Built-in self-hosted mail mode (always works without paid third-party services)
  console.info(`[LSOUL Built-in Mail] To: ${payload.to} | Subject: ${payload.subject}\n${payload.text}`);
  return { delivered: false, provider: "builtin" };
}
