# ÉLANE Fashion

Modern fashion ecommerce experience built with Next.js App Router, focused on a clean storefront, fast shopping flow, inventory management and extensible AI-assisted fashion features.

## Highlights

- Modern responsive fashion storefront
- Product search, category and color filters
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
