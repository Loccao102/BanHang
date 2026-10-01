import { PrismaClient } from "@prisma/client";
import { products } from "../src/lib/products";
import { hashPassword } from "../src/lib/server/password";

const prisma = new PrismaClient();

const customers = [
  { id: "usr-linh", email: "linh@lsoul.local", name: "Nguyễn Ngọc Linh", phone: "0912345678", city: "Hà Nội" },
  { id: "usr-nam", email: "nam@lsoul.local", name: "Trần Hoàng Nam", phone: "0987654321", city: "Hải Phòng" },
  { id: "usr-mai", email: "mai@lsoul.local", name: "Lê Mai Anh", phone: "0905123456", city: "Đà Nẵng" }
];
const guestNames = ["Minh Anh","Thu Hà","Ngọc Linh","Hoàng Nam","Quang Huy","Mai Chi"];
const cities = ["Hà Nội","TP. Hồ Chí Minh","Hải Phòng","Đà Nẵng"];
const statuses = ["processing","confirmed","shipping","completed","completed","completed"] as const;

async function reset() {
  await prisma.paymentTransaction.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.socialEvent.deleteMany();
  await prisma.socialPostProduct.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.review.deleteMany();
  await prisma.session.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeSetting.deleteMany();
}

async function main() {
  await reset();

  await prisma.product.createMany({
    data: products.map((product) => ({
      id: product.id,
      sku: product.sku ?? product.id,
      groupCode: product.groupCode ?? null,
      name: product.name,
      subtitle: product.subtitle,
      category: product.category,
      type: product.type,
      gender: product.gender,
      price: product.price,
      oldPrice: product.oldPrice ?? null,
      color: product.color,
      colorFamily: product.colorFamily,
      colorHex: product.colorHex ?? null,
      sizes: product.sizes,
      stock: product.stock,
      stockTracked: product.stockTracked !== false,
      image: product.image,
      images: product.images,
      style: product.style,
      occasion: product.occasion,
      material: product.material,
      fit: product.fit,
      featured: Boolean(product.featured),
      isNew: Boolean(product.isNew),
      active: product.active !== false,
      sourceUrl: product.sourceUrl ?? null,
      sourceUpdatedAt: product.sourceUpdatedAt ? new Date(product.sourceUpdatedAt) : null
    }))
  });

  await prisma.productVariant.createMany({
    data: products.flatMap((product) => (product.variants ?? []).map((variant) => ({
      productId: product.id,
      sku: variant.sku,
      size: variant.size,
      stock: variant.stock,
      active: variant.active
    })))
  });

  await prisma.coupon.createMany({
    data: [
      { code: "LSOUL10", type: "percentage", value: 10, minOrder: 700000, maxDiscount: 250000, active: true },
      { code: "WELCOME15", type: "percentage", value: 15, minOrder: 1000000, maxDiscount: 350000, usageLimit: 1000, active: true },
      { code: "SOCIAL20", type: "percentage", value: 20, minOrder: 1500000, maxDiscount: 500000, usageLimit: 500, active: true },
      { code: "STYLE200", type: "fixed", value: 200000, minOrder: 1800000, usageLimit: 300, active: true }
    ]
  });

  const adminPassword = hashPassword("Admin@123456");
  const customerPassword = hashPassword("Lsoul@123456");
  await prisma.user.create({ data: { id:"usr-admin", email:"admin@lsoul.local", passwordHash:adminPassword, name:"LSOUL Admin", phone:"0900000000", role:"admin" } });

  for (const customer of customers) {
    await prisma.user.create({
      data: {
        id: customer.id, email: customer.email, passwordHash: customerPassword, name: customer.name, phone: customer.phone, role: "customer",
        addresses: { create: [
          { label:"Nhà", recipientName:customer.name, phone:customer.phone, address:"28 Phố Trung Tâm", city:customer.city, isDefault:true },
          { label:"Công ty", recipientName:customer.name, phone:customer.phone, address:"88 Đường Văn Phòng", city:customer.city, isDefault:false }
        ]}
      }
    });
  }

  await prisma.storeSetting.create({ data:{ key:"promoText", value:"NEW DROP · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY" } });

  const variants = await prisma.productVariant.findMany();
  const variantMap = new Map(variants.map((variant) => [`${variant.productId}::${variant.size}`, variant]));

  for (let i = 0; i < 24; i += 1) {
    const itemCount = 1 + (i % Math.min(3, products.length));
    const selected = Array.from({ length:itemCount }, (_,j) => products[(i + j) % products.length]);
    const items = selected.map((product,j) => {
      const size = product.sizes[(i+j) % product.sizes.length];
      return { product, quantity:1, size, variant:variantMap.get(`${product.id}::${size}`) };
    });
    const subtotal = items.reduce((sum,item) => sum + item.product.price * item.quantity, 0);
    const couponCode = i % 8 === 0 ? "LSOUL10" : null;
    const discount = couponCode ? Math.min(Math.round(subtotal * .1),250000) : 0;
    const shipping = subtotal >= 699000 ? 0 : 30000;
    const total = subtotal + shipping - discount;
    const owner = i < 18 ? customers[i % customers.length] : null;
    const status = statuses[i % statuses.length];

    await prisma.order.create({
      data: {
        id:`LS26${String(1001+i)}`, userId:owner?.id ?? null, couponCode,
        createdAt:new Date(Date.now()-i*7_200_000), subtotal, shipping, discount, total,
        payment:i%2===0?"qr":"cod",
        paymentStatus:i%2===0?(status==="completed"?"paid":"pending"):"cod_pending",
        status, customerName:owner?.name ?? guestNames[i%guestNames.length],
        phone:owner?.phone ?? `09${String(10000000+i*7919).slice(-8)}`,
        address:`${12+i} Phố Trung Tâm`, city:owner?.city ?? cities[i%cities.length],
        shippingCarrier:status==="shipping"||status==="completed"?(i%2===0?"GHN":"GHTK"):null,
        trackingCode:status==="shipping"||status==="completed"?`LSOUL${String(780001+i)}`:null,
        items:{ create:items.map(({product,quantity,size,variant}) => ({
          productId:product.id, variantId:variant?.id ?? null, productName:product.name,
          productImage:product.image, productColor:product.color, productPrice:product.price, size, quantity
        }))}
      }
    });
  }

  for (let i=0;i<customers.length;i+=1) {
    const user=customers[i];
    const wishlistProducts = Array.from({length:Math.min(3,products.length)},(_,j)=>products[(i+j)%products.length]);
    await prisma.wishlistItem.createMany({ data:wishlistProducts.map((product)=>({userId:user.id,productId:product.id})) });
    const cartProducts = Array.from({length:Math.min(2,products.length)},(_,j)=>products[(i+j+1)%products.length]);
    await prisma.cartItem.createMany({ data:cartProducts.map((product,j)=>({
      userId:user.id, productId:product.id, size:product.sizes[(i+j)%product.sizes.length] ?? "", quantity:1
    })) });
  }

  const reviewCandidates = await prisma.orderItem.findMany({
    where:{order:{status:"completed",userId:{not:null}}}, include:{order:true}, take:40
  });
  const reviewed=new Set<string>();
  let reviewIndex=0;
  for (const item of reviewCandidates) {
    if (!item.order.userId) continue;
    const key=`${item.order.userId}::${item.productId}`;
    if (reviewed.has(key)) continue;
    reviewed.add(key);
    const rating=[5,5,4,5][reviewIndex%4];
    await prisma.review.create({data:{
      userId:item.order.userId, productId:item.productId, orderItemId:item.id, rating,
      title:rating===5?"Lên dáng rất đẹp":"Phom đẹp, nên chọn đúng size",
      content:rating===5?"Thiết kế tôn dáng, chất liệu ổn và lên hình rất đẹp.":"Form ôm khá chuẩn, nên xem kỹ bảng size.",
      images:[], verified:true, approved:true
    }});
    reviewIndex++;
  }

  const socialSeeds = [
    { slug:"dydy-after-dark", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Dydy Dress — ánh nâu đỏ và cấu trúc corset cho một night-out look.", productIndexes:[0] },
    { slug:"level-party-edit", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Level Dress — caro, cổ yếm và phần lưng đan dây tạo silhouette rõ nét.", productIndexes:[1] },
    { slug:"lotis-corset-set", platform:"instagram", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Lotis Set — trễ vai, tùng bèo và đai corset xanh ngọc.", productIndexes:[2] },
    { slug:"dydy-detail-edit", platform:"tiktok", authorName:"LSOUL", authorHandle:"@lsoul.officiel", caption:"Dydy detail study — bề mặt lấp lánh và corset lace-up trong cùng một silhouette.", productIndexes:[0] }
  ];

  for (let i=0;i<socialSeeds.length;i+=1) {
    const seed=socialSeeds[i];
    const product=products[seed.productIndexes[0]];
    await prisma.socialPost.create({data:{
      slug:seed.slug, platform:seed.platform, authorName:seed.authorName, authorHandle:seed.authorHandle,
      caption:seed.caption, image:product.image, status:"approved",
      likes:1200+i*760, comments:22+i*9, saves:180+i*110,
      publishedAt:new Date(Date.now()-i*86_400_000),
      products:{create:seed.productIndexes.map((productIndex,sortOrder)=>({productId:products[productIndex].id,sortOrder}))}
    }});
  }

  console.log(`Seeded ${products.length} sourced LSOUL products with size availability variants.`);
  console.log("Catalog sources are stored per product; public stock quantities are not presented as authoritative.");
  console.log("Admin: admin@lsoul.local / Admin@123456");
  console.log("Customer: linh@lsoul.local / Lsoul@123456");
}

main().catch((error)=>{console.error(error);process.exit(1);}).finally(async()=>{await prisma.$disconnect();});
