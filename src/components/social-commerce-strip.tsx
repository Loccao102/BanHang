"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";

type StripPost = { id: string; slug: string; image: string; authorHandle: string; likes: number };

export function SocialCommerceStrip() {
  const [posts, setPosts] = useState<StripPost[]>([]);

  useEffect(() => {
    void fetch("/api/social/posts")
      .then((response) => response.ok ? response.json() : { posts: [] })
      .then((data: { posts: StripPost[] }) => setPosts(data.posts.slice(0, 6)))
      .catch(() => undefined);
  }, []);

  if (!posts.length) return null;

  return <section className="socialStrip"><div className="sectionHead"><div><p className="eyebrow">LSOUL SOCIAL</p><h2>Seen on you.</h2></div><div><p>Outfits từ campaign, creators và cộng đồng — mỗi look đều có thể mua trực tiếp.</p><Link className="textLink" href="/social">Khám phá social edit <ArrowRight size={14} /></Link></div></div><div className="socialStripGrid">{posts.map((post) => <Link href={`/social#${post.slug}`} key={post.id}><div><Image src={post.image} alt={post.authorHandle} fill sizes="(max-width:760px) 50vw, 16vw" /></div><span>{post.authorHandle}</span><small><Heart size={12} /> {post.likes.toLocaleString("vi-VN")}</small></Link>)}</div></section>;
}
