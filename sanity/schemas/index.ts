import { product } from "./product";
import { category } from "./category";
import { event } from "./event";
import { homePromo } from "./homePromo";
import { siteSettings } from "./siteSettings";
import { testimonial } from "./testimonial";
import { faq } from "./faq";
import { coupon } from "./coupon";
import { popupBanner } from "./popupBanner";
import { googleReview } from "./googleReview";
import { membershipPlan } from "./membershipPlan";
import order from "./order";

export const schemaTypes = [
  // Content
  product,
  category,
  event,
  homePromo,
  testimonial,
  googleReview,
  // Marketing
  popupBanner,
  coupon,
  // Plans
  membershipPlan,
  // Help
  faq,
  // Settings
  siteSettings,
  // Orders
  order,
];
