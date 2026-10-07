"use client";

import { useMemo } from "react";
import type { CartLine } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { useStore } from "./store-provider";

function availableSizes(product: Product) {
  const tracked = product.variants
    ?.filter((variant) => variant.active !== false && variant.stock > 0)
    .map((variant) => variant.size) ?? [];
  if (tracked.length) return Array.from(new Set(tracked));
  return Array.isArray(product.sizes) ? product.sizes : [];
}

export function CartVariantControls({ line }: { line: CartLine }) {
  const { catalog, updateCartVariant } = useStore();

  const colorVariants = useMemo(() => {
    if (!line.product.groupCode) return [line.product];
    const siblings = catalog
      .filter((item) => item.active !== false && item.groupCode === line.product.groupCode)
      .sort((a, b) => a.color.localeCompare(b.color, "vi"));
    return siblings.length ? siblings : [line.product];
  }, [catalog, line.product]);

  const sizes = availableSizes(line.product);

  function changeColor(nextProductId: string) {
    const nextProduct = colorVariants.find((item) => item.id === nextProductId);
    if (!nextProduct || nextProduct.id === line.product.id) return;

    const nextSizes = availableSizes(nextProduct);
    const nextSize = line.size && nextSizes.includes(line.size)
      ? line.size
      : nextSizes[0];

    updateCartVariant(line.product.id, line.size, nextProduct, nextSize);
  }

  function changeSize(nextSize: string) {
    if (!nextSize || nextSize === line.size) return;
    updateCartVariant(line.product.id, line.size, line.product, nextSize);
  }

  return (
    <div className="cartVariantControls">
      <label className="cartVariantField">
        <span>Màu</span>
        <select
          value={line.product.id}
          onChange={(event) => changeColor(event.target.value)}
          aria-label={"Chọn màu cho " + line.product.name}
        >
          {colorVariants.map((product) => (
            <option value={product.id} key={product.id}>{product.color}</option>
          ))}
        </select>
      </label>
      <label className="cartVariantField">
        <span>Size</span>
        <select
          value={line.size ?? sizes[0] ?? ""}
          onChange={(event) => changeSize(event.target.value)}
          aria-label={"Chọn size cho " + line.product.name}
          disabled={!sizes.length}
        >
          {sizes.map((size) => <option value={size} key={size}>{size}</option>)}
        </select>
      </label>
    </div>
  );
}
