import { generationTasks } from "./generation-queue";
import fs from "fs";
import path from "path";

const publicDir = path.join(process.cwd(), "public", "products");

// A file is already genuinely generated if its size > 100KB and mtime > 5:00 AM (or whatever indicates true high-res image)
const pending = generationTasks.filter((task) => {
  const filePath = path.join(publicDir, task.targetFilename);
  if (!fs.existsSync(filePath)) return true;
  const stat = fs.statSync(filePath);
  // Files created by tint script are either small or modified at 4:10 AM
  const isTinted = stat.size < 100000 || (stat.mtime.getHours() === 4 && stat.mtime.getMinutes() >= 9 && stat.mtime.getMinutes() <= 11);
  return isTinted;
});

console.log(`=== PENDING TASKS COUNT: ${pending.length} / ${generationTasks.length} ===`);
pending.forEach((t, i) => {
  console.log(`${i + 1}. [${t.category}] ${t.targetFilename} (${t.color}) -> ${t.imageName}`);
});
