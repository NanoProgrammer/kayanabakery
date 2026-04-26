import { groq } from "next-sanity";

// Featured categories for home
export const featuredCategoriesQuery = groq`
  *[_type == "category" && isFeatured == true] | order(displayOrder asc) {
    _id,
    name,
    "slug": slug.current,
    tagline,
    description,
    image,
    accentColor
  }
`;

// All categories
export const allCategoriesQuery = groq`
  *[_type == "category"] | order(displayOrder asc) {
    _id,
    name,
    "slug": slug.current,
    tagline,
    description,
    image,
    accentColor
  }
`;

// Single category with its products
export const categoryBySlugQuery = groq`
  *[_type == "category" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    tagline,
    description,
    image,
    accentColor,
    "products": *[_type == "product" && references(^._id)] | order(displayOrder asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      price,
      compareAtPrice,
      image,
      tag,
      inStock,
      unit,
      leadTime
    }
  }
`;

// Signature products for home
export const featuredProductsQuery = groq`
  *[_type == "product" && isFeatured == true] | order(displayOrder asc) [0...8] {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    compareAtPrice,
    image,
    tag,
    inStock,
    unit,
    leadTime,
    "categories": categories[]->{ "slug": slug.current, name }
  }
`;

// All products
export const allProductsQuery = groq`
  *[_type == "product"] | order(displayOrder asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    price,
    compareAtPrice,
    image,
    tag,
    inStock,
    unit,
    leadTime,
    "categories": categories[]->{ "slug": slug.current, name }
  }
`;

// Single product
export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    description,
    longDescription,
    price,
    compareAtPrice,
    image,
    gallery,
    tag,
    inStock,
    stockQuantity,
    unit,
    leadTime,
    allergens,
    "categories": categories[]->{ "slug": slug.current, name }
  }
`;

// Upcoming events (start date >= now)
export const upcomingEventsQuery = groq`
  *[_type == "event" && startDate >= now()] | order(startDate asc) [0...6] {
    _id,
    title,
    "slug": slug.current,
    startDate,
    endDate,
    dateLabel,
    location,
    address,
    image,
    externalUrl,
    isFeatured
  }
`;

// All events
export const allEventsQuery = groq`
  *[_type == "event"] | order(startDate desc) {
    _id,
    title,
    "slug": slug.current,
    startDate,
    endDate,
    dateLabel,
    location,
    address,
    image,
    description,
    externalUrl
  }
`;

// Home promo
export const homePromoQuery = groq`
  *[_type == "homePromo" && enabled == true][0] {
    eyebrow,
    title,
    description,
    image,
    ctaLabel,
    ctaHref,
    discount,
    validUntil
  }
`;

// Site settings
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    announcementBar,
    heroTitle,
    heroSubtitle,
    heroImage,
    referralDiscount,
    pickupAddress,
    contactPhone,
    contactEmail
  }
`;

// Featured testimonials
export const featuredTestimonialsQuery = groq`
  *[_type == "testimonial" && isFeatured == true] | order(displayOrder asc) [0...3] {
    _id,
    quote,
    author,
    role,
    accent
  }
`;
