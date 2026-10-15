import dotenv from "dotenv";
dotenv.config();

const key = (process.env.GEMINI_API_KEY || "").replace(/^["']|["']$/g, "").trim();

async function checkModel(model: string) {
  const start = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Chào bạn, hãy trả lời 5 từ." }] }]
      })
    });
    const elapsed = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`[${model}] SUCCESS in ${elapsed}ms: ${text}`);
      return true;
    } else {
      console.log(`[${model}] FAILED with status ${res.status} in ${elapsed}ms`);
      return false;
    }
  } catch (err: any) {
    console.log(`[${model}] ERROR: ${err?.message}`);
    return false;
  }
}

async function main() {
  const candidates = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-flash-lite-latest"
  ];
  for (const model of candidates) {
    await checkModel(model);
  }
}

main();
