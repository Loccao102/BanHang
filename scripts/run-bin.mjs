import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Chạy CLI cục bộ (prisma / tsx) bằng chính Node đang thực thi.
 *
 * Không dùng `npx`/`npx.cmd` qua spawnSync vì:
 * - Từ Node >= 20.12/22/24, gọi file `.cmd` không qua shell sẽ ném EINVAL (Windows).
 * - Còn `shell: true` lại sinh cảnh báo DEP0190 và phụ thuộc shell.
 * Gọi trực tiếp entry point JS là cách ổn định trên cả Windows, macOS và Linux.
 */
const LOCAL_BINARIES = {
  prisma: "../node_modules/prisma/build/index.js",
  tsx: "../node_modules/tsx/dist/cli.mjs"
};

export function localBinPath(name) {
  const relative = LOCAL_BINARIES[name];
  if (!relative) throw new Error(`Không tìm thấy CLI cục bộ: ${name}`);
  return fileURLToPath(new URL(relative, import.meta.url));
}

export function runLocalBin(name, args, env = process.env) {
  const result = spawnSync(process.execPath, [localBinPath(name), ...args], { stdio: "inherit", env });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

/** Chạy lần lượt các bước [tên CLI, mảng tham số]; dừng ngay ở bước lỗi đầu tiên. */
export function runLocalBinSteps(steps, env = process.env) {
  for (const [name, args] of steps) {
    const status = runLocalBin(name, args, env);
    if (status !== 0) process.exit(status);
  }
}
