"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isStorefrontPath(pathname: string) {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/checkout") && !pathname.startsWith("/login") && !pathname.startsWith("/register");
}

export function SiteMotion() {
  const pathname = usePathname();
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [cursor, setCursor] = useState({ x: -100, y: -100, active: false, label: "" });
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    setTransitioning(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

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

  useEffect(() => {
    const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)");
    if (!finePointer.matches) return;

    document.body.dataset.customCursor = "true";

    const move = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("a,button,[data-cursor]") as HTMLElement | null;
      let label = interactive?.dataset.cursor ?? "";
      if (!label && interactive?.matches("a")) label = "VIEW";
      if (!label && interactive?.matches("button")) label = "SELECT";
      if (interactive?.closest(".productCard")) label = "VIEW";
      if (interactive?.closest(".luxCategoryCard")) label = "EXPLORE";
      setCursor({ x: event.clientX, y: event.clientY, active: Boolean(interactive), label });
    };

    const leave = () => setCursor((current) => ({ ...current, active: false }));

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      delete document.body.dataset.customCursor;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isStorefrontPath(pathname)) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === pathname && url.search === window.location.search) return;
      if (url.hash && url.pathname === pathname && url.search === window.location.search) return;
      if (!isStorefrontPath(url.pathname)) return;

      event.preventDefault();
      setTransitioning(true);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(() => {
        router.push(url.pathname + url.search + url.hash);
      }, 430);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    };
  }, [pathname, router]);

  return (
    <>
      <div className="pageScrollProgress" aria-hidden="true" />
      <div className={`routeTransition ${transitioning ? "isActive" : ""}`} aria-hidden="true">
        <div className="routeTransitionWord">LSOUL</div>
        <div className="routeTransitionLine" />
      </div>
      <div
        className={`luxCursor ${cursor.active ? "isActive" : ""} ${cursor.label ? "hasLabel" : ""}`}
        style={{ transform: `translate3d(${cursor.x}px,${cursor.y}px,0)` }}
        aria-hidden="true"
      >
        <span>{cursor.label}</span>
      </div>
    </>
  );
}
