import { product } from "./product";
import { productOption, productOptionChoice } from "./productOption";
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
import customer from "./customer";

export const schemaTypes = [
  // Content
  product,
  // Building blocks for product options (sizes, flavours).
  productOption,
  productOptionChoice,
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
  // People
  customer,
];
