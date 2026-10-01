import { NextResponse } from "next/server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const { modelImage, garmentImage, category = "auto" } = await request.json();
  if (!modelImage || !garmentImage) return NextResponse.json({ error: "Thiếu ảnh người hoặc ảnh sản phẩm." }, { status: 400 });

  const apiKey = process.env.FASHN_API_KEY;
  if (!apiKey) return NextResponse.json({ mode: "unavailable", message: "Dịch vụ thử đồ trực tuyến hiện chưa khả dụng." }, { status: 503 });

  const run = await fetch("https://api.fashn.ai/v1/run", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: modelImage,
        garment_image: garmentImage,
        category,
        mode: "balanced",
        output_format: "jpeg",
        moderation_level: "conservative"
      }
    })
  });

  if (!run.ok) {
    const detail = await run.text();
    return NextResponse.json({ error: `FASHN không nhận request: ${detail}` }, { status: run.status });
  }

  const initial = await run.json();
  if (!initial.id) return NextResponse.json({ error: "FASHN không trả prediction id." }, { status: 502 });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await sleep(1000);
    const statusResponse = await fetch(`https://api.fashn.ai/v1/status/${initial.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    if (!statusResponse.ok) continue;
    const status = await statusResponse.json();
    if (status.status === "completed") return NextResponse.json({ mode: "live", output: status.output?.[0], predictionId: initial.id });
    if (status.status === "failed") return NextResponse.json({ error: status.error?.message ?? "Virtual try-on thất bại." }, { status: 502 });
  }

  return NextResponse.json({ error: "Virtual try-on đang xử lý quá lâu. Hãy thử lại." }, { status: 504 });
}
