"use client";

import Image from "next/image";
import { Camera, LoaderCircle, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { products } from "@/lib/products";

const garments = products.filter((item) => ["tops", "bottoms", "outerwear", "dress"].includes(item.category));

export function TryOnClient() {
  const searchParams = useSearchParams();
  const initial = garments.find((item) => item.id === searchParams.get("product")) ?? garments[0];
  const [selected, setSelected] = useState(initial);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Upload ảnh toàn thân rõ người, sau đó chọn sản phẩm để thử.");
  const canRun = Boolean(personImage && selected);

  const category = useMemo(() => selected.category === "bottoms" ? "bottoms" : selected.category === "dress" ? "one-pieces" : "tops", [selected]);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Ảnh vượt quá dung lượng cho phép. Vui lòng chọn ảnh dưới 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPersonImage(String(reader.result));
      setResultImage(null);
      setMessage("Ảnh đã sẵn sàng. Chọn sản phẩm rồi bấm Thử ngay.");
    };
    reader.readAsDataURL(file);
  }

  async function runTryOn() {
    if (!personImage) return;
    setLoading(true);
    setResultImage(null);
    setMessage("AI đang dựng trang phục lên ảnh của bạn...");
    try {
      const response = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelImage: personImage, garmentImage: selected.image, category })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Không thể tạo ảnh");
      if (data.mode === "unavailable") {
        setResultImage(null);
        setMessage("Dịch vụ thử đồ trực tuyến hiện chưa khả dụng. Vui lòng thử lại sau.");
      } else {
        setResultImage(data.output);
        setMessage("Hoàn tất. Bạn có thể đổi sản phẩm và thử lại.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi khi thử đồ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="tryonPage">
      <div className="tryonHero"><p className="eyebrow">VIRTUAL FITTING ROOM</p><h1>Try it on.</h1><p style={{maxWidth: 720, color: 'var(--muted)', lineHeight: 1.7}}>Tải ảnh của bạn lên, chọn sản phẩm và xem trang phục được thể hiện trực tiếp trên ảnh trước khi quyết định mua.</p></div>
      <div className="tryonGrid">
        <div className="uploadCard">
          <div className="cardTitle"><span>01 / Ảnh của bạn</span><Camera size={17} /></div>
          <label className="uploadZone">
            {personImage ? <Image src={personImage} alt="Ảnh người dùng" fill unoptimized /> : <div className="uploadHint"><Upload size={28} /><p>Nhấn để upload ảnh toàn thân.<br />JPG / PNG · tối đa 3MB.</p></div>}
            <input hidden type="file" accept="image/jpeg,image/png" onChange={onFile} />
          </label>
        </div>
        <div className="garmentCard">
          <div className="cardTitle"><span>02 / Chọn sản phẩm</span><WandSparkles size={17} /></div>
          <div className="garmentScroller">{garments.map((item) => <button className={`garmentOption ${selected.id === item.id ? "active" : ""}`} key={item.id} onClick={() => {setSelected(item); setResultImage(null);}} aria-label={`Chọn ${item.name}`}><Image src={item.image} alt={item.name} fill sizes="160px" /></button>)}</div>
        </div>
        <div className="resultCard">
          <div className="cardTitle"><span>03 / Kết quả AI</span><span style={{fontWeight: 400}}>{selected.name}</span></div>
          <div className="resultCanvas">
            {resultImage ? <Image src={resultImage} alt="Kết quả thử đồ AI" fill unoptimized /> : personImage ? <div className="previewCompare"><div><span>YOU</span><Image src={personImage} alt="Ảnh người" fill unoptimized /></div><div><span>GARMENT</span><Image src={selected.image} alt={selected.name} fill /></div></div> : <div><WandSparkles size={30} /><p>Ảnh AI sẽ xuất hiện tại đây.</p></div>}
          </div>
          <p style={{fontSize: 12, color: 'var(--muted)', lineHeight: 1.55}}>{message}</p>
          <div className="resultActions"><button className="btn block accent" disabled={!canRun || loading} onClick={runTryOn}>{loading ? <LoaderCircle size={17} className="spin" /> : <WandSparkles size={17} />} {loading ? "Đang xử lý..." : "Thử ngay bằng AI"}</button></div>
        </div>
      </div>
    </section>
  );
}
