"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SiteMotion() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    const body = document.body;
    body.dataset.page = pathname === "/" ? "home" : "inner";

    let revealIndex = 0;
    const observed = new WeakSet<Element>();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.inview = "true";
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

    const observeReveal = (root: ParentNode = document) => {
      const targets: HTMLElement[] = [];

      if (root instanceof HTMLElement && root.matches("[data-reveal]")) {
        targets.push(root);
      }
      targets.push(...Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]")));

      for (const item of targets) {
        if (observed.has(item)) continue;
        observed.add(item);

        item.style.setProperty("--reveal-delay", `${Math.min(revealIndex % 6, 5) * 55}ms`);
        revealIndex += 1;

        // Commerce/product imagery should never remain hidden if it mounts
        // after route hydration. The observer still handles its entrance when possible.
        if (item.classList.contains("immersiveGalleryImage")) {
          item.dataset.inview = "true";
          continue;
        }

        observer.observe(item);
      }
    };

    observeReveal();

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) observeReveal(node);
        }
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      body.dataset.scrolled = y > 52 ? "true" : "false";
      body.style.setProperty(
        "--scroll-progress",
        String(Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)))
      );

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
      mutationObserver.disconnect();
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
