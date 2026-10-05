// Gọi đúng như UI admin (cổng 3001) để tái hiện lỗi lưu sản phẩm.
const ADMIN = "http://localhost:3001";

async function main() {
  const login = await fetch(`${ADMIN}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@lsoul.local", password: "Admin@123456" })
  });
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => /lsoul_session=[^;]+/.exec(c)?.[0]).filter(Boolean).join("; ");
  console.log("login:", login.status, "| cookie:", Boolean(cookie));

  const post = async (label, product) => {
    const res = await fetch(`${ADMIN}/api/products`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(product)
    });
    const body = await res.json().catch(() => ({}));
    console.log(`${label}: status=${res.status} ${JSON.stringify(body).slice(0, 100)}`);
  };

  const boot = await (await fetch(`${ADMIN}/api/store/bootstrap`)).json();
  const existing = boot.products[0];

  await post("A. sửa sản phẩm có sẵn (qua cổng 3001)", existing);

  // Đúng như blankProduct() trong admin/page.tsx
  const blank = {
    id: "",
    sku: "",
    name: "SAN PHAM NHAP TAY",
    subtitle: "",
    category: "tops",
    type: "corset",
    gender: "women",
    price: 399000,
    color: "Đen",
    colorFamily: "black",
    sizes: ["S", "M", "L", "XL"],
    stock: 10,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85"],
    style: ["minimal"],
    occasion: ["casual"],
    material: "Cotton",
    fit: "Regular fit",
    active: true,
    featured: false,
    isNew: true,
    tryOnCategory: "tops",
    tryOnPhotoType: "model",
    season: ["spring", "summer"],
    formality: 2, warmth: 2, stretch: 2, coverage: 3,
    colorTemperature: "neutral",
    pairingTags: [], avoidPairingTags: [],
    id_generated: "san-pham-nhap-tay-test"
  };
  await post("B. thêm sản phẩm mới (subtitle rỗng, ảnh ngoài)", { ...blank, id: "san-pham-nhap-tay-test" });

  await post("C. thêm SP thiếu trường bắt buộc (subtitle undefined)", {
    ...blank, id: "san-pham-thieu-truong", subtitle: undefined, material: undefined
  });

  await post("D. thêm SP trùng SKU đang có", {
    ...blank, id: "san-pham-trung-sku", sku: existing.sku
  });
}

void main();
