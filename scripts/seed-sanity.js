/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seed Karyana Sanity dataset with starter content.
 *
 * Usage:
 *   npm run seed:sanity
 *
 * Requires env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@sanity/client");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

if (!process.env.SANITY_API_WRITE_TOKEN) {
  console.error(
    "❌ Missing SANITY_API_WRITE_TOKEN. Get a write token in Sanity manage console."
  );
  process.exit(1);
}

const FAQS = [
  // General
  {
    _type: "faq",
    category: "general",
    questionEn: "Where is Karyana located?",
    questionEs: "¿Dónde está Karyana?",
    answerEn: "We're a home-based bakery in Southeast Calgary. We deliver across Calgary and offer pickup at scheduled times.",
    answerEs: "Somos una panadería casera en el Sureste de Calgary. Hacemos envíos por todo Calgary y ofrecemos recolección en horarios programados.",
    order: 1,
  },
  {
    _type: "faq",
    category: "general",
    questionEn: "Do you bake fresh every day?",
    questionEs: "¿Hornean fresco todos los días?",
    answerEn: "Yes — every order is baked fresh the day of pickup or delivery. Some specialty cakes need 24h advance notice.",
    answerEs: "Sí — cada orden se hornea fresca el día de la entrega o recolección. Algunos pasteles especiales requieren 24h de anticipación.",
    order: 2,
  },
  // Orders
  {
    _type: "faq",
    category: "orders",
    questionEn: "How do I place an order?",
    questionEs: "¿Cómo hago un pedido?",
    answerEn: "Browse the shop, add items to your cart, and checkout. You can choose pickup or delivery and pay securely with a card.",
    answerEs: "Explora la tienda, agrega productos al carrito y paga. Puedes elegir recolección o envío y pagar con tarjeta de forma segura.",
    order: 1,
  },
  {
    _type: "faq",
    category: "orders",
    questionEn: "Can I modify or cancel my order?",
    questionEs: "¿Puedo modificar o cancelar mi orden?",
    answerEn: "Contact us as soon as possible. We can usually accommodate changes if your order hasn't started baking yet.",
    answerEs: "Contáctanos lo antes posible. Generalmente podemos acomodar cambios si tu orden aún no ha empezado a hornearse.",
    order: 2,
  },
  // Delivery
  {
    _type: "faq",
    category: "delivery",
    questionEn: "When do you deliver?",
    questionEs: "¿Cuándo entregan?",
    answerEn: "Standard delivery windows are Monday 6-8pm and Friday 7-9pm. Members get additional weekday windows from 9am-5pm.",
    answerEs: "Los horarios estándar son Lunes 6-8pm y Viernes 7-9pm. Los miembros tienen horarios adicionales entre 9am-5pm de lunes a viernes.",
    order: 1,
  },
  {
    _type: "faq",
    category: "delivery",
    questionEn: "Is delivery free?",
    questionEs: "¿El envío es gratis?",
    answerEn: "First delivery is free for SE Calgary residents. Members get free delivery on every order with a minimum purchase. Otherwise delivery is $7.",
    answerEs: "La primera entrega es gratis para residentes del Sureste de Calgary. Los miembros tienen envío gratis en cada orden con compra mínima. Si no, el envío es $7.",
    order: 2,
  },
  // Custom cakes
  {
    _type: "faq",
    category: "custom-cakes",
    questionEn: "How far in advance should I order a custom cake?",
    questionEs: "¿Con cuánta anticipación debo pedir un pastel personalizado?",
    answerEn: "We recommend ordering at least 5-7 days ahead for custom cakes. For standard sizes, 48h is usually enough.",
    answerEs: "Recomendamos ordenar al menos 5-7 días antes para pasteles personalizados. Para tamaños estándar, 48h suele ser suficiente.",
    order: 1,
  },
  // Memberships
  {
    _type: "faq",
    category: "memberships",
    questionEn: "Can I cancel my membership anytime?",
    questionEs: "¿Puedo cancelar mi membresía cuando quiera?",
    answerEn: "Yes. You'll keep your benefits until the end of the current billing period, then you'll go back to the free Basico plan.",
    answerEs: "Sí. Mantienes tus beneficios hasta el final del periodo de facturación actual, luego regresas al plan Básico gratuito.",
    order: 1,
  },
  {
    _type: "faq",
    category: "memberships",
    questionEn: "How do points work?",
    questionEs: "¿Cómo funcionan los puntos?",
    answerEn: "100 points = $1 CAD. You earn points on every purchase based on your tier (1x to 10x). Redeem them at checkout.",
    answerEs: "100 puntos = $1 CAD. Ganas puntos en cada compra según tu tier (de 1x a 10x). Canjéalos al pagar.",
    order: 2,
  },
  // Payment
  {
    _type: "faq",
    category: "payment",
    questionEn: "What payment methods do you accept?",
    questionEs: "¿Qué métodos de pago aceptan?",
    answerEn: "We accept all major credit and debit cards through Square — secure encrypted processing.",
    answerEs: "Aceptamos todas las tarjetas de crédito y débito mayores a través de Square — procesamiento seguro y encriptado.",
    order: 1,
  },
];

const MEMBERSHIP_PLANS_CMS = [
  {
    _type: "membershipPlan",
    tier: "BASICO",
    tagEn: "Free forever",
    tagEs: "Gratis siempre",
    descriptionEn: "Start here. No commitment.",
    descriptionEs: "Empieza aquí. Sin compromiso.",
    isFeatured: false,
    order: 1,
  },
  {
    _type: "membershipPlan",
    tier: "ARTESANO",
    tagEn: "Save on every order",
    tagEs: "Ahorra en cada orden",
    descriptionEn: "Yearly plan with free delivery and 2x points.",
    descriptionEs: "Plan anual con envío gratis y 2x puntos.",
    isFeatured: false,
    order: 2,
  },
  {
    _type: "membershipPlan",
    tier: "SELECTO",
    tagEn: "Most loved",
    tagEs: "El favorito",
    descriptionEn: "Best value. 4x points and 6 free breads in your first box.",
    descriptionEs: "Mejor valor. 4x puntos y 6 panes gratis en tu primera caja.",
    highlightEn: "Most popular",
    highlightEs: "Más popular",
    isFeatured: true,
    order: 3,
  },
  {
    _type: "membershipPlan",
    tier: "LEGENDARIO",
    tagEn: "Full access",
    tagEs: "Acceso total",
    descriptionEn: "All benefits, 5x points, 4 free new breads per month.",
    descriptionEs: "Todos los beneficios, 5x puntos, 4 panes nuevos al mes.",
    isFeatured: false,
    order: 4,
  },
  {
    _type: "membershipPlan",
    tier: "EMBAJADOR",
    tagEn: "By application",
    tagEs: "Por aplicación",
    descriptionEn: "Free membership for community ambassadors. 10x points, paid deliveries.",
    descriptionEs: "Membresía gratuita para embajadores. 10x puntos, entregas pagadas.",
    isFeatured: false,
    order: 5,
  },
];

const POPUP_BANNER = {
  _type: "popupBanner",
  isActive: false, // off by default — owner can turn it on
  mode: "modal",
  frequency: "session",
  titleEn: "Welcome to Karyana 🌸",
  titleEs: "Bienvenido a Karyana 🌸",
  bodyEn: "Use code WELCOME10 for 10% off your first order.",
  bodyEs: "Usa el código WELCOME10 para 10% en tu primera orden.",
  ctaLabelEn: "Shop now",
  ctaLabelEs: "Comprar",
  ctaHref: "/shop",
};

const SAMPLE_REVIEWS = [
  {
    _type: "googleReview",
    authorName: "Maria G.",
    rating: 5,
    textEn: "The conchas remind me of home. Best Mexican bakery in Calgary, hands down.",
    textEs: "Las conchas me recuerdan a casa. Sin duda la mejor panadería mexicana de Calgary.",
    isFeatured: true,
    order: 1,
  },
  {
    _type: "googleReview",
    authorName: "James W.",
    rating: 5,
    textEn: "Tres leches cake for my wife's birthday — absolutely perfect. Will order again.",
    textEs: "Pastel de tres leches para el cumpleaños de mi esposa — absolutamente perfecto. Volveré a pedir.",
    isFeatured: true,
    order: 2,
  },
  {
    _type: "googleReview",
    authorName: "Sofia R.",
    rating: 5,
    textEn: "Karyana is now part of our weekly routine. The membership is so worth it.",
    textEs: "Karyana ya es parte de nuestra rutina semanal. La membresía vale muchísimo la pena.",
    isFeatured: true,
    order: 3,
  },
];

const SITE_SETTINGS = {
  _type: "siteSettings",
  _id: "siteSettings",
  storeName: "Karyana Ruiz Bakery",
  taglineEn: "More than bread, a home memory.",
  taglineEs: "Más que pan, un recuerdo de hogar.",
  heroTitle: "Mexican pan dulce,\nbaked with love in Calgary.",
  heroTitleEs: "Pan dulce mexicano,\nhecho con amor en Calgary.",
  heroSubtitle:
    "Conchas, custom cakes, and the authentic bakery you remember from home.",
  heroSubtitleEs:
    "Conchas, pasteles personalizados y la auténtica panadería que recuerdas de casa.",
  contactEmail: "hola@karyanabakery.ca",
  contactPhone: "(403) 555-1234",
  referralDiscount: 10,
  announcementBarEn:
    "✨ Free delivery on your first order in SE Calgary",
  announcementBarEs:
    "✨ Envío gratis en tu primera orden en el Sureste de Calgary",
};

async function main() {
  console.log("🌱 Seeding Sanity dataset...\n");

  // Site settings (singleton)
  await client.createOrReplace(SITE_SETTINGS);
  console.log("✓ Site settings");

  // FAQs
  for (const faq of FAQS) {
    await client.create(faq);
  }
  console.log(`✓ ${FAQS.length} FAQs`);

  // Membership plan CMS docs
  for (const plan of MEMBERSHIP_PLANS_CMS) {
    await client.create(plan);
  }
  console.log(`✓ ${MEMBERSHIP_PLANS_CMS.length} membership plan docs`);

  // Popup banner (off by default)
  await client.create(POPUP_BANNER);
  console.log("✓ Popup banner (inactive by default)");

  // Sample reviews
  for (const review of SAMPLE_REVIEWS) {
    await client.create(review);
  }
  console.log(`✓ ${SAMPLE_REVIEWS.length} sample Google reviews\n`);

  console.log("✅ Sanity seed complete!");
  console.log(
    "\nNext: visit /studio to upload images for products, categories, hero, etc."
  );
  console.log(
    "Note: WELCOME10 coupon must be created via /admin or directly in the database."
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
