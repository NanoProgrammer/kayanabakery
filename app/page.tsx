import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { SignatureProducts } from "@/components/home/SignatureProducts";
import { HolidayBanner } from "@/components/home/HolidayBanner";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { ReferralBanner } from "@/components/home/ReferralBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  featuredCategoriesQuery,
  featuredProductsQuery,
  homePromoQuery,
  upcomingEventsQuery,
  siteSettingsQuery,
  featuredTestimonialsQuery,
} from "@/sanity/lib/queries";
import {
  Category,
  Product,
  HomePromo,
  BakeryEvent,
  SiteSettings,
  Testimonial,
} from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  // Parallel fetch from Sanity
  const [categories, products, promo, events, settings, testimonials] =
    await Promise.all([
      sanityFetch<Category[]>({
        query: featuredCategoriesQuery,
        tags: ["category"],
      }),
      sanityFetch<Product[]>({
        query: featuredProductsQuery,
        tags: ["product"],
      }),
      sanityFetch<HomePromo | null>({
        query: homePromoQuery,
        tags: ["homePromo"],
      }),
      sanityFetch<BakeryEvent[]>({
        query: upcomingEventsQuery,
        tags: ["event"],
      }),
      sanityFetch<SiteSettings | null>({
        query: siteSettingsQuery,
        tags: ["siteSettings"],
      }),
      sanityFetch<Testimonial[]>({
        query: featuredTestimonialsQuery,
        tags: ["testimonial"],
      }),
    ]);

  return (
    <>
      <Hero settings={settings} />
      <FeaturedCategories categories={categories} />
      <SignatureProducts products={products} />
      {promo && <HolidayBanner promo={promo} />}
      <UpcomingEvents events={events} />
      <ReferralBanner discount={settings?.referralDiscount} />
      <Testimonials testimonials={testimonials} />
      <Newsletter />
    </>
  );
}
