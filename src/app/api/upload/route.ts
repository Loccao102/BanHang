import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (user && user.role !== "admin") {
      return NextResponse.json(
        { error: "Chỉ quản trị viên mới có quyền tải ảnh lên hệ thống." },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Vui lòng gửi dữ liệu dưới dạng multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Không tìm thấy file ảnh để tải lên." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Kích thước ảnh tối đa cho phép là 10MB." },
        { status: 400 }
      );
    }

    const mime = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { error: "Định dạng ảnh không được hỗ trợ (chỉ nhận JPG, PNG, WebP, GIF, AVIF)." },
        { status: 400 }
      );
    }

    const extension = mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filename = `prod-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl, filename });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: "Không thể lưu ảnh trên máy chủ." },
      { status: 500 }
    );
  }
}
