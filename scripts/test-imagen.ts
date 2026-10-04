import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY?.trim();

async function testImagen() {
  const models = [
    "imagen-3.0-generate-002",
    "imagen-3.0-generate-001"
  ];

  for (const m of models) {
    try {
      console.log("Testing", m);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:predict?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: "High-end e-commerce flat-lay product photograph of camel beige tailored hourglass blazer, white background" }],
          parameters: { sampleCount: 1, aspectRatio: "3:4" }
        })
      });
      console.log(m, "Status:", res.status);
      const text = await res.text();
      console.log(m, "Response:", text.slice(0, 300));
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
    }
  }
}

testImagen();
