import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY?.trim();

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  if (data.models) {
    const names = data.models.map((m: any) => ({ name: m.name, methods: m.supportedGenerationMethods }));
    console.log("Total models:", names.length);
    console.log(names);
  } else {
    console.log(data);
  }
}

listModels();
