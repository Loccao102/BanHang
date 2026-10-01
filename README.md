# ÉLANE Fashion

Modern fashion ecommerce experience built with Next.js App Router. The local development environment uses SQLite + Prisma for persistent product, inventory, order and store-setting data.

## Highlights

- Modern responsive fashion storefront
- 170 seeded clothing products across T-shirts, shirts, polos, hoodies, knitwear, blazers, jackets, coats, jeans, trousers, chinos, shorts, skirts and dresses
- Product search, category, clothing type, color and price filters
- Product detail, wishlist, cart and checkout
- VietQR checkout flow
- AI shopping assistant with product cards and conversation history
- Outfit recommendation from in-stock catalog
- "Mix another look" flow that avoids immediate repeats
- Virtual Try-On page with optional FASHN Cloud API integration
- Store administration dashboard

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Optional AI integration

Copy `.env.example` to `.env.local`.

- `GEMINI_API_KEY`: enables natural-language styling responses while product retrieval remains grounded in the store catalog.
- `FASHN_API_KEY`: enables cloud virtual try-on through FASHN Try-On v1.6.

## Payment

Checkout generates a VietQR image from the configured bank account and order total. Bank transfer orders are submitted for payment confirmation and order processing.


## Deployment trigger

Repository này được deploy qua Vercel; các commit lên `main` sẽ kích hoạt build lại.


## Local database

The local app uses SQLite through Prisma. No external database account is required.

```bash
npm install
npm run db:setup
npm run dev
```

`npm run db:setup` creates `prisma/dev.db` and seeds:

- 170 clothing products
- 24 sample orders
- store promotion settings
- varied stock levels, sizes, colors, pricing, sale items, new arrivals and featured products

Product and order changes made from the admin page are persisted to SQLite while running locally. Cart and wishlist remain browser-side until customer authentication is introduced.

To reset the local dataset:

```bash
npm run db:seed
```
