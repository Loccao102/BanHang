import { Client } from "@gradio/client";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.HF_TOKEN?.trim();

async function checkSpaces() {
  const spaces = [
    "yisol/IDM-VTON",
    "Kwai-Kolors/Kolors-Virtual-Try-On",
    "fashn-ai/fashn-vton-1.5"
  ];

  for (const space of spaces) {
    try {
      console.log("Connecting to:", space);
      const client = await Client.connect(space, token ? { token: token as `hf_${string}` } : undefined);
      console.log(space, "Connected! Endpoints:", Object.keys(client.view_api ? await client.view_api() : {}));
    } catch (e) {
      console.log(space, "Failed to connect:", e instanceof Error ? e.message : e);
    }
  }
}

checkSpaces();
