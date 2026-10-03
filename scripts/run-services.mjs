import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "=======================================================");
console.log("\x1b[36m%s\x1b[0m", "  LSOUL FASHION COMMERCE — DUAL SERVICE LAUNCHER");
console.log("\x1b[36m%s\x1b[0m", "=======================================================");
console.log("\x1b[32m%s\x1b[0m", "  ▶ [STOREFRONT] Cổng 3000 : http://localhost:3000");
console.log("\x1b[33m%s\x1b[0m", "  ▶ [ADMIN]      Cổng 3001 : http://localhost:3001/admin");
console.log("\x1b[36m%s\x1b[0m", "=======================================================\n");

function startService(name, color, port, role) {
  const env = {
    ...process.env,
    PORT: String(port),
    APP_ROLE: role,
    NEXT_PUBLIC_STORE_URL: "http://localhost:3000",
    NEXT_PUBLIC_ADMIN_URL: "http://localhost:3001"
  };

  const proc = spawn(npmCmd, ["run", role === "admin" ? "dev:admin" : "dev:store"], {
    env,
    shell: true,
    stdio: ["inherit", "pipe", "pipe"]
  });

  proc.stdout?.on("data", (data) => {
    const lines = data.toString().trimEnd().split("\n");
    for (const line of lines) {
      console.log(`${color}[${name}]\x1b[0m ${line}`);
    }
  });

  proc.stderr?.on("data", (data) => {
    const lines = data.toString().trimEnd().split("\n");
    for (const line of lines) {
      console.error(`${color}[${name} ERR]\x1b[0m ${line}`);
    }
  });

  proc.on("close", (code) => {
    console.log(`${color}[${name}]\x1b[0m Dừng với mã ${code}`);
  });

  return proc;
}

const storeProc = startService("STORE-3000", "\x1b[32m", 3000, "storefront");
const adminProc = startService("ADMIN-3001", "\x1b[33m", 3001, "admin");

function cleanup() {
  console.log("\nĐang tắt các dịch vụ LSOUL...");
  try { storeProc.kill(); } catch {}
  try { adminProc.kill(); } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
