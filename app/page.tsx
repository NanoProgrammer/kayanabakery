import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { SignatureProducts } from "@/components/home/SignatureProducts";
import { HolidayBanner } from "@/components/home/HolidayBanner";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { ReferralBanner } from "@/components/home/ReferralBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { GoogleReviewsSection } from "@/components/home/GoogleReviewsSection";
import { Newsletter } from "@/components/home/Newsletter";
import { MembershipTeaser } from "@/components/home/MembershipTeaser";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  featuredCategoriesQuery,
  featuredProductsQuery,
  upcomingEventsQuery,
  homePromoQuery,
  siteSettingsQuery,
  featuredTestimonialsQuery,
  featuredGoogleReviewsQuery,
} from "@/sanity/lib/queries";
import type {
  Category,
  Product,
  BakeryEvent,
  HomePromo,
  SiteSettings,
  Testimonial,
  GoogleReview,
} from "@/types";

export const revalidate = 60;

export default async function HomePage() {
  const [
    categories,
    products,
    events,
    promo,
    settings,
    testimonials,
    reviews,
  ] = await Promise.all([
    sanityFetch<Category[]>({
      query: featuredCategoriesQuery,
      tags: ["category"],
    }),
    sanityFetch<Product[]>({
      query: featuredProductsQuery,
      tags: ["product"],
    }),
    sanityFetch<BakeryEvent[]>({
      query: upcomingEventsQuery,
      tags: ["event"],
    }),
    sanityFetch<HomePromo | null>({
      query: homePromoQuery,
      tags: ["homePromo"],
    }),
    sanityFetch<SiteSettings>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
    sanityFetch<Testimonial[]>({
      query: featuredTestimonialsQuery,
      tags: ["testimonial"],
    }),
    sanityFetch<GoogleReview[]>({
      query: featuredGoogleReviewsQuery,
      tags: ["googleReview"],
    }),
  ]);

  return (
    <>
      <Hero settings={settings} />
      <FeaturedCategories categories={categories} />
      <SignatureProducts products={products} />
      {promo && <HolidayBanner promo={promo} />}
      <MembershipTeaser />
      <UpcomingEvents events={events} />
      <ReferralBanner discount={settings?.referralDiscount ?? 10} />
      <GoogleReviewsSection  />
      <Testimonials testimonials={testimonials} />
      <Newsletter />
    </>
  );
}
