import { generationTasks } from "./generation-queue";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const artifactDirs = [
  "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\97e91f28-4fa7-4448-8746-88713d81b524",
  "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\8df4e9ee-d8d6-4e64-84c2-94f3a7e2ece7"
];
const publicDir = path.join(process.cwd(), "public", "products");

const allArtifactFiles: { file: string; dir: string; fullPath: string }[] = [];
for (const dir of artifactDirs) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      allArtifactFiles.push({ file: f, dir, fullPath: path.join(dir, f) });
    }
  }
}

console.log("=== SCANNING GENERATED ARTIFACTS ===");
let copiedCount = 0;

for (const task of generationTasks) {
  // Find matching artifact file like `${task.imageName}_*.jpg` or `${task.imageName}.jpg`
  const matches = allArtifactFiles.filter(item => item.file.startsWith(task.imageName) && (item.file.endsWith(".jpg") || item.file.endsWith(".png") || item.file.endsWith(".webp")));
  if (matches.length > 0) {
    // Sort by timestamp desc to get newest
    matches.sort((a, b) => b.file.localeCompare(a.file));
    const newest = matches[0];
    const src = newest.fullPath;
    const dest = path.join(publicDir, task.targetFilename);

    const statSrc = fs.statSync(src);
    // If destination does not exist or has different size, copy it
    let needCopy = true;
    if (fs.existsSync(dest)) {
      const statDest = fs.statSync(dest);
      if (statDest.size === statSrc.size) {
        needCopy = false;
      }
    }

    if (needCopy) {
      fs.copyFileSync(src, dest);
      console.log(`[COPIED] ${newest} -> ${task.targetFilename} (${Math.round(statSrc.size / 1024)} KB)`);
      copiedCount++;

      // Also copy to docker containers if running
      try {
        execSync(`docker cp "${dest}" lsoul-web:/app/public/products/${task.targetFilename}`, { stdio: "ignore" });
        execSync(`docker cp "${dest}" lsoul-admin:/app/public/products/${task.targetFilename}`, { stdio: "ignore" });
      } catch {
        // ignore if container not ready
      }
    }
  }
}

console.log(`=== SYNC FINISHED: ${copiedCount} files copied to public/products and Docker ===`);
