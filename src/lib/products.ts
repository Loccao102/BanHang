export type ProductCategory = "tops" | "bottoms" | "outerwear" | "dress" | "shoes" | "accessory";

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  gender: "women" | "men" | "unisex";
  price: number;
  oldPrice?: number;
  color: string;
  colorFamily: "black" | "white" | "navy" | "beige" | "blue" | "brown" | "red" | "green";
  sizes: string[];
  stock: number;
  image: string;
  images: string[];
  style: string[];
  occasion: string[];
  material: string;
  fit: string;
  featured?: boolean;
  isNew?: boolean;
};

export const products: Product[] = [
  {
    id: "polo-noir",
    name: "Polo Noir Essential",
    subtitle: "Polo cotton pique tối giản",
    category: "tops",
    gender: "unisex",
    price: 429000,
    oldPrice: 499000,
    color: "Đen",
    colorFamily: "black",
    sizes: ["S", "M", "L", "XL"],
    stock: 18,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "smart-casual"],
    occasion: ["work", "date", "casual"],
    material: "Cotton pique",
    fit: "Regular fit",
    featured: true,
    isNew: true
  },
  {
    id: "shirt-ivory",
    name: "Ivory Air Shirt",
    subtitle: "Sơ mi relaxed mềm nhẹ",
    category: "tops",
    gender: "unisex",
    price: 489000,
    color: "Trắng kem",
    colorFamily: "white",
    sizes: ["S", "M", "L", "XL"],
    stock: 14,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "smart-casual"],
    occasion: ["work", "date", "casual"],
    material: "Cotton blend",
    fit: "Relaxed fit",
    featured: true
  },
  {
    id: "chino-stone",
    name: "Stone Tailored Chino",
    subtitle: "Quần chino ly nhẹ dáng thẳng",
    category: "bottoms",
    gender: "unisex",
    price: 559000,
    color: "Stone",
    colorFamily: "beige",
    sizes: ["28", "30", "32", "34", "36"],
    stock: 21,
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "smart-casual", "classic"],
    occasion: ["work", "date", "casual"],
    material: "Cotton twill",
    fit: "Straight fit",
    featured: true,
    isNew: true
  },
  {
    id: "chino-navy",
    name: "Navy City Chino",
    subtitle: "Quần navy clean line",
    category: "bottoms",
    gender: "unisex",
    price: 529000,
    color: "Xanh navy",
    colorFamily: "navy",
    sizes: ["28", "30", "32", "34", "36"],
    stock: 12,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "smart-casual"],
    occasion: ["work", "date", "casual"],
    material: "Cotton twill",
    fit: "Straight fit"
  },
  {
    id: "blazer-graphite",
    name: "Graphite Soft Blazer",
    subtitle: "Blazer không dựng vai",
    category: "outerwear",
    gender: "unisex",
    price: 899000,
    color: "Đen graphite",
    colorFamily: "black",
    sizes: ["S", "M", "L", "XL"],
    stock: 8,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1598808503746-f34cfb6c2524?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "smart-casual", "classic"],
    occasion: ["work", "date"],
    material: "Poly-viscose",
    fit: "Relaxed tailored",
    featured: true
  },
  {
    id: "denim-blue",
    name: "Blue Straight Denim",
    subtitle: "Jeans xanh wash nhẹ",
    category: "bottoms",
    gender: "unisex",
    price: 629000,
    color: "Xanh denim",
    colorFamily: "blue",
    sizes: ["28", "30", "32", "34", "36"],
    stock: 17,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["casual", "street"],
    occasion: ["casual", "date"],
    material: "Denim cotton",
    fit: "Straight fit"
  },
  {
    id: "dress-sienna",
    name: "Sienna Slip Dress",
    subtitle: "Váy midi thanh lịch",
    category: "dress",
    gender: "women",
    price: 749000,
    color: "Nâu sienna",
    colorFamily: "brown",
    sizes: ["S", "M", "L"],
    stock: 9,
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "feminine", "classic"],
    occasion: ["date", "party"],
    material: "Satin blend",
    fit: "Fluid fit",
    isNew: true
  },
  {
    id: "tee-olive",
    name: "Olive Heavy Tee",
    subtitle: "T-shirt cotton dày phom đẹp",
    category: "tops",
    gender: "unisex",
    price: 329000,
    color: "Xanh olive",
    colorFamily: "green",
    sizes: ["S", "M", "L", "XL"],
    stock: 26,
    image: "https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "street", "casual"],
    occasion: ["casual"],
    material: "Heavy cotton",
    fit: "Boxy fit"
  },
  {
    id: "loafer-brown",
    name: "Brown City Loafer",
    subtitle: "Loafer da nâu clean toe",
    category: "shoes",
    gender: "unisex",
    price: 799000,
    color: "Nâu cacao",
    colorFamily: "brown",
    sizes: ["38", "39", "40", "41", "42", "43"],
    stock: 11,
    image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["classic", "smart-casual"],
    occasion: ["work", "date"],
    material: "Faux leather",
    fit: "Regular"
  },
  {
    id: "sneaker-white",
    name: "Cloud White Sneaker",
    subtitle: "Sneaker trắng tối giản",
    category: "shoes",
    gender: "unisex",
    price: 699000,
    color: "Trắng",
    colorFamily: "white",
    sizes: ["38", "39", "40", "41", "42", "43"],
    stock: 19,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "casual", "street"],
    occasion: ["casual", "date"],
    material: "Synthetic leather",
    fit: "Regular"
  },
  {
    id: "bag-black",
    name: "Mini Arc Bag",
    subtitle: "Túi mini form cong",
    category: "accessory",
    gender: "women",
    price: 459000,
    color: "Đen",
    colorFamily: "black",
    sizes: ["One size"],
    stock: 13,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["minimal", "classic", "feminine"],
    occasion: ["date", "work", "casual"],
    material: "PU leather",
    fit: "One size"
  },
  {
    id: "cap-charcoal",
    name: "Charcoal Soft Cap",
    subtitle: "Mũ lưỡi trai vải mềm",
    category: "accessory",
    gender: "unisex",
    price: 249000,
    color: "Xám than",
    colorFamily: "black",
    sizes: ["One size"],
    stock: 20,
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=85",
    images: [
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1000&q=85"
    ],
    style: ["street", "casual", "minimal"],
    occasion: ["casual"],
    material: "Cotton twill",
    fit: "Adjustable"
  }
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export const getProduct = (id: string) => products.find((item) => item.id === id);

export const categoryLabels: Record<ProductCategory, string> = {
  tops: "Áo",
  bottoms: "Quần",
  outerwear: "Áo khoác",
  dress: "Váy",
  shoes: "Giày",
  accessory: "Phụ kiện"
};
