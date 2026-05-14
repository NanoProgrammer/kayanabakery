import { groq } from "next-sanity";

// ── CATEGORIES ──
export const featuredCategoriesQuery = groq`
  *[_type == "category" && isFeatured == true] | order(displayOrder asc) {
    _id, name, nameEs, "slug": slug.current,
    tagline, taglineEs,
    description, descriptionEs,
    image, accentColor
  }
`;

export const allCategoriesQuery = groq`
  *[_type == "category"] | order(displayOrder asc) {
    _id, name, nameEs, "slug": slug.current,
    tagline, taglineEs,
    description, descriptionEs,
    image, accentColor
  }
`;

export const categoryBySlugQuery = groq`
  *[_type == "category" && slug.current == $slug][0] {
    _id, name, nameEs, "slug": slug.current,
    tagline, taglineEs,
    description, descriptionEs,
    image, accentColor,
    "products": *[_type == "product" && ^._id in categories[]._ref] | order(displayOrder asc) {
      _id, name, nameEs, "slug": slug.current,
      description, descriptionEs,
      price, compareAtPrice, image, tag,
      inStock, unit, leadTime, membersOnly, isOffSeason,
      "categories": categories[]->{ "slug": slug.current, name, nameEs }
    }
  }
`;

// ── PRODUCTS ──
export const featuredProductsQuery = groq`
  *[_type == "product" && isFeatured == true] | order(displayOrder asc) [0...8] {
    _id, name, nameEs, "slug": slug.current,
    description, descriptionEs,
    price, compareAtPrice, image, tag,
    inStock, unit, leadTime, membersOnly, isOffSeason,
    "categories": categories[]->{ "slug": slug.current, name, nameEs }
  }
`;

export const allProductsQuery = groq`
  *[_type == "product"] | order(displayOrder asc) {
    _id, name, nameEs, "slug": slug.current,
    description, descriptionEs,
    price, compareAtPrice, image, tag,
    inStock, unit, leadTime, membersOnly, isOffSeason,
    "categories": categories[]->{ "slug": slug.current, name, nameEs }
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id, name, nameEs, "slug": slug.current,
    description, descriptionEs,
    longDescription, longDescriptionEs,
    price, compareAtPrice, image, gallery, tag,
    inStock, stockQuantity, unit, leadTime,
    allergens, membersOnly, isOffSeason,
    "categories": categories[]->{ "slug": slug.current, name, nameEs }
  }
`;

// ── EVENTS ──
export const upcomingEventsQuery = groq`
  *[_type == "event" && startDate >= now()] | order(startDate asc) [0...6] {
    _id, title, titleEs, "slug": slug.current,
    startDate, endDate, dateLabel,
    location, address, image, externalUrl, isFeatured
  }
`;

export const allEventsQuery = groq`
  *[_type == "event"] | order(startDate desc) {
    _id, title, titleEs, "slug": slug.current,
    startDate, endDate, dateLabel,
    location, address, image,
    description, descriptionEs,
    externalUrl
  }
`;

// ── HOME PROMO ──
export const homePromoQuery = groq`
  *[_type == "homePromo" && enabled == true][0] {
    eyebrow, eyebrowEs,
    title, titleEs,
    description, descriptionEs,
    image,
    ctaLabel, ctaLabelEs, ctaHref,
    discount, validUntil
  }
`;

// ── SITE SETTINGS ──
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    announcementBar, announcementBarEs,
    heroTitle, heroTitleEs,
    heroSubtitle, heroSubtitleEs,
    heroImage, referralDiscount,
    pickupAddress, contactPhone, contactEmail,
    deliveryFreeMinSE
  }
`;

// ── TESTIMONIALS ──
export const featuredTestimonialsQuery = groq`
  *[_type == "testimonial" && isFeatured == true] | order(displayOrder asc) [0...3] {
    _id, quote, quoteEs, author, role, accent
  }
`;

// ── GOOGLE REVIEWS ──
export const featuredGoogleReviewsQuery = groq`
  *[_type == "googleReview" && isFeatured == true] | order(displayOrder asc) [0...6] {
    _id, authorName, authorPhoto, rating,
    textEn, textEs, reviewDate, googleUrl
  }
`;

// ── FAQ ──
export const allFaqsQuery = groq`
  *[_type == "faq" && active == true] | order(displayOrder asc) {
    _id, questionEn, questionEs,
    answerEn, answerEs, category
  }
`;

// ── COUPONS ──
export const couponByCodeQuery = groq`
  *[_type == "coupon" && code == $code && active == true][0] {
    _id, code, labelEn, labelEs,
    discountType, discountValue,
    minOrderDollars, maxUses, perUserLimit,
    startsAt, expiresAt,
    appliesTo, membershipOnly, publicShow
  }
`;

export const publicCouponsQuery = groq`
  *[_type == "coupon" && active == true && publicShow == true && (expiresAt == null || expiresAt > now())] | order(_createdAt desc) [0...5] {
    _id, code, labelEn, labelEs,
    discountType, discountValue,
    minOrderDollars, expiresAt
  }
`;

// ── POPUP BANNERS ──
export const activePopupBannerQuery = groq`
  *[_type == "popupBanner" && active == true && (startsAt == null || startsAt < now()) && (endsAt == null || endsAt > now())] | order(_updatedAt desc) [0] {
    _id,
    titleEn, titleEs,
    messageEn, messageEs,
    image,
    ctaLabelEn, ctaLabelEs, ctaHref,
    showOnPaths, displayMode, frequency, delaySeconds
  }
`;

// ── MEMBERSHIP PLANS (copy) ──
export const membershipPlansQuery = groq`
  *[_type == "membershipPlan"] | order(displayOrder asc) {
    _id, tier, displayOrder,
    tagEn, tagEs,
    descriptionEn, descriptionEs,
    highlightEn, highlightEs,
    image, isFeatured
  }
`;
