// Tái hiện lỗi lưu sản phẩm từ trang admin.
const STORE = "http://localhost:3000";

async function main() {
  const login = await fetch(`${STORE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@lsoul.local", password: "Admin@123456" })
  });
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => /lsoul_session=[^;]+/.exec(c)?.[0]).filter(Boolean).join("; ");
  console.log("login admin:", login.status, "| cookie:", Boolean(cookie));

  const boot = await (await fetch(`${STORE}/api/store/bootstrap`)).json();
  const existing = boot.products[0];

  const save = async (label, product) => {
    const res = await fetch(`${STORE}/api/products`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(product)
    });
    const body = await res.json().catch(() => ({}));
    console.log(`${label}: status=${res.status} body=${JSON.stringify(body).slice(0, 120)}`);
    return res.status;
  };

  console.log("\n--- 1. Lưu lại nguyên trạng sản phẩm đang có (mô phỏng bấm Lưu khi sửa) ---");
  await save("update-existing", existing);

  console.log("\n--- 2. Tạo sản phẩm MỚI (mô phỏng bấm Thêm sản phẩm) ---");
  const created = {
    ...existing,
    id: "",
    sku: "",
    name: "TEST SAN PHAM MOI",
    subtitle: "Sản phẩm test",
    image: "/products/top-ribbed-crop-white.jpg",
    hoverImage: "/products/top-ribbed-crop-white.jpg",
    images: ["/products/top-ribbed-crop-white.jpg"],
    tryOnImage: "/products/top-ribbed-crop-white.jpg",
    variants: undefined,
    sizes: ["S", "M"],
    stock: 10
  };
  await save("create-new (sku rỗng)", created);
  await save("create-new (sku có mã)", { ...created, sku: "TP-TEST-NEW" });

  console.log("\n--- 3. Sản phẩm mới có id nhưng chưa tồn tại trong DB ---");
  await save("create-new (id lạ)", { ...created, id: "lsoul-test-new-product", sku: "TP-TEST-NEW-2" });
}

void main();
