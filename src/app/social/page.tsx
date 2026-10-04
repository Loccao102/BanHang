"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Instagram, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";

type SocialPostView = {
  id: string;
  slug: string;
  platform: string;
  authorName: string;
  authorHandle: string;
  caption: string;
  image: string;
  likes: number;
  comments: number;
  saves: number;
  publishedAt: string;
  products: Product[];
};

export default function SocialPage() {
  const { user, catalog, addToCart } = useStore();
  const [posts, setPosts] = useState<SocialPostView[]>([]);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPosts() {
    const response = await fetch("/api/social/posts", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { posts: SocialPostView[] };
    setPosts(data.posts);
  }

  useEffect(() => { void loadPosts(); }, []);

  async function track(post: SocialPostView, type: string, channel: string, productId?: string) {
    void fetch("/api/social/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, channel, postId: post.id, productId })
    });
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: data.get("caption"),
        image: data.get("image"),
        handle: data.get("handle"),
        platform: "community",
        productIds: data.getAll("productIds")
      })
    });
    const result = await response.json();
    setMessage(response.ok ? "Bài của bạn đã được gửi và đang chờ duyệt." : result.error ?? "Không thể gửi bài.");
    if (response.ok) {
      form.reset();
      setSubmitOpen(false);
    }
  }

  return (
    <section className="socialPage">
      <div className="socialHero"><p className="eyebrow">LSOUL SOCIAL</p><h1>Seen on you.</h1><p>Looks từ LSOUL, creators và cộng đồng. Chạm vào sản phẩm trong từng bài để mua trực tiếp từ cảm hứng bạn vừa thấy.</p><div>{user ? <button className="btn" onClick={() => setSubmitOpen((value) => !value)}>Đăng look của bạn <Send size={15} /></button> : <Link className="btn" href="/login?next=/social">Đăng nhập để gửi look</Link>}<a className="btn secondary" href="https://www.instagram.com/lsoul.officiel/" target="_blank" rel="noreferrer"><Instagram size={15} /> @lsoul.officiel</a></div></div>

      {submitOpen ? <form className="socialSubmit" onSubmit={submitPost}><div><p className="eyebrow">COMMUNITY LOOK</p><h2>Chia sẻ outfit LSOUL</h2></div><label><span>Ảnh outfit (URL)</span><input name="image" type="url" required placeholder="https://..." /></label><label><span>Instagram / TikTok handle</span><input name="handle" placeholder="@username" /></label><label className="full"><span>Caption</span><textarea name="caption" required minLength={10} rows={4} placeholder="Kể một chút về cách bạn phối look này..." /></label><fieldset className="full"><legend>Tag tối đa 4 sản phẩm</legend><div className="socialProductPicker">{catalog.filter((item) => item.active !== false).slice(0, 24).map((product) => <label key={product.id}><input type="checkbox" name="productIds" value={product.id} /> {product.name}</label>)}</div></fieldset><button className="btn" type="submit">Gửi để duyệt</button></form> : null}
      {message ? <p className="socialMessage">{message}</p> : null}

      <div className="socialFeed">{posts.map((post) => <article className="socialCard" id={post.slug} key={post.id}>
        <div className="socialMedia"><Image src={post.image} alt={post.caption} fill sizes="(max-width:760px) 100vw, 50vw" /></div>
        <div className="socialContent">
          <div className="socialAuthor"><span><strong>{post.authorName}</strong><small>{post.authorHandle} · {post.platform}</small></span></div>
          <p>{post.caption}</p>
          <div className="socialSignals"><span><Heart size={15} /> {post.likes.toLocaleString("vi-VN")}</span><span><MessageCircle size={15} /> {post.comments.toLocaleString("vi-VN")}</span><span><ShoppingBag size={15} /> Shop the look</span></div>
          <div className="socialTagged">{post.products.map((product) => <div className="socialTaggedProduct" key={product.id}><Link href={`/product/${product.id}`} onClick={() => track(post, "product_click", post.platform, product.id)}><div><Image src={product.image} alt={product.name} fill unoptimized sizes="60px" /></div><span><strong>{product.name}</strong><small>{formatPrice(product.price)}</small></span></Link><button title="Thêm vào giỏ" aria-label={`Thêm ${product.name} vào giỏ`} onClick={() => { const size = product.variants?.find((variant) => variant.stock > 0)?.size ?? (Array.isArray(product.sizes) ? product.sizes[0] : "S"); addToCart(product, size); void track(post, "add_to_cart", post.platform, product.id); }}><ShoppingBag size={13} /></button></div>)}</div>
        </div>
      </article>)}</div>
    </section>
  );
}
