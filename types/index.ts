// ─── Sanity Document Types ───────────────────────────────

export type Category = {
  _id: string;
  name: string;
  nameEs?: string;
  slug: string;
  tagline?: string;
  taglineEs?: string;
  description?: string;
  descriptionEs?: string;
  image?: any;
  accentColor?: string;
  isFeatured?: boolean;
  displayOrder?: number;
};

export type Product = {
  _id: string;
  name: string;
  nameEs?: string;
  slug: string;
  description?: string;
  descriptionEs?: string;
  longDescription?: any;
  longDescriptionEs?: any;
  price: number;
  compareAtPrice?: number;
  image?: any;
  gallery?: any[];
  tag?: string;
  inStock: boolean;
  stockQuantity?: number;
  unit?: string;
  leadTime?: number;
  allergens?: string[];
  membersOnly?: boolean;
  isOffSeason?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  categories?: { slug: string; name: string }[];
};

export type BakeryEvent = {
  _id: string;
  title: string;
  titleEs?: string;
  slug: string;
  startDate: string;
  endDate?: string;
  dateLabel?: string;
  location: string;
  address?: string;
  image?: any;
  description?: any;
  externalUrl?: string;
  isFeatured?: boolean;
};

export type HomePromo = {
  eyebrow?: string;
  eyebrowEs?: string;
  title: string;
  titleEs?: string;
  description?: string;
  descriptionEs?: string;
  image: any;
  ctaLabel?: string;
  ctaLabelEs?: string;
  ctaHref?: string;
  discount?: string;
  validUntil?: string;
};

export type SiteSettings = {
  announcementBar?: string[];
  announcementBarEs?: string[];
  heroTitle?: string;
  heroTitleEs?: string;
  heroSubtitle?: string;
  heroSubtitleEs?: string;
  heroImage?: any;
  referralDiscount?: number;
  pickupAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
};

export type Testimonial = {
  _id: string;
  quote: string;
  quoteEs?: string;
  author: string;
  role?: string;
  accent?: string;
  isFeatured?: boolean;
  displayOrder?: number;
};

export type GoogleReview = {
  _id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
};

export type FAQ = {
  _id: string;
  questionEn: string;
  questionEs?: string;
  answerEn: string;
  answerEs?: string;
  category?: string;
  displayOrder?: number;
};

export type PopupBanner = {
  _id: string;
  titleEn: string;
  titleEs?: string;
  messageEn?: string;
  messageEs?: string;
  ctaLabelEn?: string;
  ctaLabelEs?: string;
  ctaHref?: string;
  image?: any;
  displayMode?: "modal" | "top-bar" | "bottom-slide";
  frequency?: "always" | "once" | "session";
  delaySeconds?: number;
  showOnPaths?: string[];
};

export type MembershipPlanCMS = {
  _id: string;
  tier: string;
  tagEn?: string;
  tagEs?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  highlightEn?: string;
  highlightEs?: string;
  isFeatured?: boolean;
};

// ─── Cart ────────────────────────────────────────────────

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  nameEs?: string;
  price: number;
  image?: string;
  unit?: string;
  leadTime?: number;
  quantity: number;
  membersOnly?: boolean;
};