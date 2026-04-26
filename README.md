# 🥖 Karyana Bakery — E-commerce

> More than bread, a home memory.

Full-stack Next.js 16 e-commerce for a handcrafted Mexican bakery in Calgary.

## ✨ Features

- **Next.js 16** + React 19 + TypeScript + Tailwind v4
- **Sanity CMS** for products, categories, events, site settings (`/studio`)
- **Auth.js v5** (Credentials + Google) + Prisma + Postgres
- **Square Web Payments SDK** for checkout
- **Walmart-style quantity stepper** on shop & cart (connected to Zustand store)
- **Resend + React Email** for order confirmations
- **@react-pdf/renderer** for printable invoice/BOL sent to owner
- **Referral system** with $10 credit (Las penas con pan son menos)
- **Customer account dashboard** (orders, addresses, preferences, referrals)
- Custom design system using otomí colors & Fraunces/Inter/Caveat fonts

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in the values
```

Required services:

| Service | What you need |
|---------|--------------|
| Postgres | Connection string (Neon, Supabase, Vercel Postgres) |
| Sanity | Project ID + dataset (create at sanity.io/manage) |
| Auth.js | `AUTH_SECRET` → `openssl rand -base64 32` |
| Google OAuth | (optional) clientId + clientSecret |
| Square | Access token, location ID, public app ID |
| Resend | API key, sender domain |

### 3. Database

```bash
npx prisma db push
npx prisma generate
```

### 4. Shadcn (first-time only)

The project uses shadcn/ui with the New York style + Maia preset. The most important components (`accordion`, `sonner`) are pre-included. To add more:

```bash
npx shadcn@latest add button input dialog sheet
```

### 5. Run

```bash
npm run dev
```

- Main site: http://localhost:3000
- Sanity Studio: http://localhost:3000/studio

### 6. Seed Sanity

Open the Studio and create:

1. **Site Settings** (1 document) — hero title, referral discount, contact info
2. **Categories** (4+ featured) — Conchas, Cakes, Traditional Bread, Corn Pancakes
3. **Products** (link to categories, mark 8 as featured)
4. **Home Promo** (1 document) — holiday banner
5. **Events** (upcoming pop-ups)
6. **Testimonials** (3 featured)

### 7. Sanity webhook (auto-revalidation)

In Sanity → API → Webhooks, add:

- URL: `https://yourdomain.com/api/sanity/revalidate`
- Secret: match `SANITY_WEBHOOK_SECRET` in `.env`
- Projection: `{ _type, slug }`

## 📁 Project structure

```
app/
├── (shop)/         # Shop, product, category, cart, checkout pages
├── (pages)/        # How-to-order, FAQ, Events, About, Contact, Refer
├── (auth)/         # Login, Register
├── account/        # Dashboard (orders, addresses, preferences, referrals)
├── api/            # auth, register, checkout, addresses, contact, webhooks
├── studio/         # Embedded Sanity Studio
├── page.tsx        # Home (fetches from Sanity)
├── layout.tsx
└── globals.css     # Tailwind v4 + Karyana design tokens

components/
├── home/           # Hero, FeaturedCategories, SignatureProducts, etc.
├── layout/         # Navbar, Footer
├── product/        # ProductCard, QuantityAddToCart
├── cart/           # CartDrawer
├── checkout/       # CheckoutForm (Square)
├── account/        # AddressManager, PreferencesForm, ReferralShare
├── auth/           # LoginForm, RegisterForm
└── ui/             # shadcn components

lib/
├── store/cart-store.ts    # Zustand + persist
├── auth/auth.ts           # Auth.js config
├── email/                 # Resend + React Email + PDF
├── square/                # Square client
├── prisma.ts
└── utils.ts

sanity/
├── schemas/               # product, category, event, homePromo, siteSettings, testimonial
└── lib/                   # client, image, queries, fetch

emails/
├── OrderConfirmation.tsx  # Customer email
└── OwnerNewOrder.tsx      # Owner notification (with PDF attachment)

prisma/
└── schema.prisma          # User, Account, Session, Address, Order
```

## 🎨 Design tokens

All colors are defined as CSS variables in `app/globals.css` (Tailwind v4 `@theme`):

| Token | Hex | Use |
|-------|-----|-----|
| `cream` | #FBF6EE | Background |
| `masa` | #F3EADB | Secondary bg |
| `canela` | #6B4423 | Primary text/CTA |
| `concha-rosa` | #E8B4B8 | Accents |
| `otomi-red` | #D64545 | Accent (eyebrow text) |
| `otomi-teal` | #3BA5A0 | Accent |
| `otomi-green` | #5B8C3E | Accent |
| `ink` | #2B1810 | Dark text |

Fonts: **Fraunces** (display), **Inter** (body), **Caveat** (script).

## 📬 How emails + PDFs work

On order confirmation:
1. Customer receives branded order confirmation (React Email → HTML)
2. Owner receives order notification with **PDF invoice/BOL attached** (@react-pdf/renderer)
3. PDF includes order details, customer info, itemized list, totals — ready to print

## 🔐 Security notes

- Passwords are hashed with bcrypt (cost 12)
- Middleware protects `/account/*` routes
- Sanity webhook signature verified
- Server-only env vars never exposed to client

## 🌮 ¡Gracias!

Built with cariño.

---

_"Las penas con pan son menos."_
