# ÉLANE Fashion

Modern fashion ecommerce experience built with Next.js App Router, Prisma and PostgreSQL.

## Highlights

- Modern responsive fashion storefront
- 170 seeded clothing products across T-shirts, shirts, polos, hoodies, knitwear, blazers, jackets, coats, jeans, trousers, chinos, shorts, skirts and dresses
- Product search, category, clothing type, color and price filters
- Customer registration, login and persistent sessions
- Account profile, address book, synced wishlist/cart and order history
- Product detail, wishlist, cart and checkout
- VietQR checkout flow
- Store administration dashboard with role protection
- AI shopping assistant and Virtual Try-On integration points

## Local development

PostgreSQL runs locally with Docker.

```bash
npm install
npm run db:up
npm run db:setup
npm run dev
```

Open http://localhost:3000

Default local connection:

```env
DATABASE_URL="postgresql://elane:elane_dev@localhost:5432/elane?schema=public"
```

`npm run db:setup` creates the schema and seeds:

- 170 clothing products
- 4 users
- 6 saved addresses
- persisted carts and wishlists
- 24 sample orders
- store promotion settings

Seed accounts:

```text
Admin
admin@elane.local
Admin@123456

Customer
linh@elane.local
Elane@123456
```

Useful database commands:

```bash
npm run db:up
npm run db:down
npm run db:seed
npm run db:studio
```

## Production / Vercel

Use a hosted PostgreSQL database and set `DATABASE_URL` in Vercel Environment Variables. The application no longer relies on SQLite, so account, cart, wishlist, orders and admin data can persist across serverless deployments.

Before the first production deployment, initialize the target database with the Prisma schema and seed only if you want the sample dataset:

```bash
DATABASE_URL="<production-postgres-url>" npx prisma db push
DATABASE_URL="<production-postgres-url>" npm run db:seed
```

Do not run the sample seed against a live store after real customer data exists.

## Optional AI integration

Copy `.env.example` to `.env.local`.

- `GEMINI_API_KEY`: enables natural-language styling responses while product retrieval remains grounded in the store catalog.
- `FASHN_API_KEY`: enables cloud virtual try-on through FASHN Try-On v1.6.

## Payment

Checkout generates a VietQR image from the configured bank account and order total. Bank transfer orders are submitted for payment confirmation and order processing.
