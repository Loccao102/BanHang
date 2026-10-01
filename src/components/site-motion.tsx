"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const body = document.body;
    body.dataset.page = pathname === "/" ? "home" : "inner";

    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.inview = "true";
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

    revealTargets.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
      observer.observe(item);
    });

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      body.dataset.scrolled = y > 52 ? "true" : "false";
      body.style.setProperty("--scroll-progress", String(Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight))));

      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const speed = Number(element.dataset.parallax || "0.06");
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        element.style.setProperty("--parallax-y", `${centerOffset * -speed}px`);
      });
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      delete body.dataset.page;
      delete body.dataset.scrolled;
    };
  }, [pathname]);

  return <div className="pageScrollProgress" aria-hidden="true" />;
}
