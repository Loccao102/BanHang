import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY?.replace(/^["']|["']$/g, "").trim();

async function checkModels() {
  const models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-image", "gemini-3-flash-preview"];
  for (const m of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    console.log(m, "Status:", res.status);
    if (!res.ok) {
      const err = await res.json();
      console.log(m, "Error:", err.error?.message?.slice(0, 100));
    } else {
      console.log(m, "SUCCESS!");
    }
  }
}

checkModels();
