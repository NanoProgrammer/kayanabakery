import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export type SanityImage = SanityImageSource & {
  _type?: "image";
  asset?: { _ref: string; _type: string };
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  image?: SanityImage;
  accentColor?: string;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  longDescription?: any;
  price: number;
  compareAtPrice?: number;
  image: SanityImage;
  gallery?: SanityImage[];
  tag?: "bestseller" | "new" | "seasonal" | "limited" | "";
  inStock: boolean;
  stockQuantity?: number;
  unit?: string;
  leadTime?: number;
  allergens?: string[];
  categories?: { slug: string; name: string }[];
};

export type BakeryEvent = {
  _id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate?: string;
  dateLabel?: string;
  location: string;
  address?: string;
  image?: SanityImage;
  description?: any;
  externalUrl?: string;
  isFeatured?: boolean;
};

export type HomePromo = {
  eyebrow?: string;
  title: string;
  description?: string;
  image: SanityImage;
  ctaLabel?: string;
  ctaHref?: string;
  discount?: string;
  validUntil?: string;
};

export type SiteSettings = {
  announcementBar?: string[];
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: SanityImage;
  referralDiscount?: number;
  pickupAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
};

export type Testimonial = {
  _id: string;
  quote: string;
  author: string;
  role?: string;
  accent?: string;
};

// Cart item (local, not from Sanity)
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  unit?: string;
  leadTime?: number;
};

// Order types (from Prisma)
export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit?: string;
};
