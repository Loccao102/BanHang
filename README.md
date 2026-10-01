# ÉLANE Fashion — AI Commerce Demo

Modern fashion ecommerce demo built with Next.js App Router. The project intentionally keeps auth/payment infrastructure lightweight for student-project demonstrations while making the user-facing flows feel complete.

## Highlights

- Modern responsive fashion storefront
- Product search, category and color filters
- Product detail, wishlist, cart and checkout
- VietQR demo checkout flow
- AI shopping assistant with product cards + conversation history (localStorage)
- Outfit recommendation from in-stock catalog
- "Mix another look" flow that avoids immediate repeats
- Virtual Try-On page with optional FASHN Cloud API integration
- Basic admin/demo dashboard

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Optional AI integration

Copy `.env.example` to `.env.local`.

- `GEMINI_API_KEY`: optional. Product retrieval always happens locally first so the model cannot invent catalog items.
- `FASHN_API_KEY`: optional. Enables real cloud virtual try-on through FASHN Try-On v1.6. Without it the page stays fully usable in demo preview mode.

## Demo payment

Checkout generates a VietQR image from public bank/account environment values. This is intentionally a demo/manual-confirmation payment flow and does not verify bank transactions.


## Deployment trigger

Repository này được deploy qua Vercel; các commit lên `main` sẽ kích hoạt build lại.
