import { Hero } from "@/components/home/Hero";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { SignatureProducts } from "@/components/home/SignatureProducts";
import { HolidayBanner } from "@/components/home/HolidayBanner";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { ReferralBanner } from "@/components/home/ReferralBanner";
import { ConchaVideoSection } from "@/components/home/VideoConchaEmoji";
import { GoogleReviewsSection } from "@/components/home/GoogleReviewsSection";
import { Newsletter } from "@/components/home/Newsletter";
import { MembershipTeaser } from "@/components/home/MembershipTeaser";
import { CakesSpotlight } from "@/components/home/CakesSpotlight";
import { BreadBoxesSpotlight } from "@/components/home/BreadBoxesSpotlight";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  featuredCategoriesQuery,
  featuredProductsQuery,
  upcomingEventsQuery,
  homePromoQuery,
  siteSettingsQuery,
  featuredTestimonialsQuery,
  featuredGoogleReviewsQuery,
  allProductsQuery,
} from "@/sanity/lib/queries";
import { selectCakes, selectBreadBoxes } from "@/lib/products/home-sections";
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
    allProducts,
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
    // El catálogo entero, y el filtro se hace en código.
    //
    // Antes eran dos consultas GROQ que pedían el slug exacto "cakes" y
    // "boxes". Si la categoría en Sanity se llama de otra forma, la
    // consulta devuelve cero y la sección simplemente no aparece — que
    // es lo que pasó. Ver lib/products/home-sections.ts.
    sanityFetch<Product[]>({
      query: allProductsQuery,
      tags: ["product"],
    }),
  ]);

  const cakes = selectCakes((allProducts ?? []) as any[]) as unknown as Product[];
  const breadBoxes = selectBreadBoxes((allProducts ?? []) as any[]) as unknown as Product[];

  return (
    <>
      <Hero settings={settings} categories={categories} />
      {/* Situación 9: cakes first, to sell more of them. */}
      <CakesSpotlight cakes={cakes ?? []} />
      {/* The second door the brief names, right behind the first. */}
      <BreadBoxesSpotlight boxes={breadBoxes ?? []} />
      <Newsletter />
      <SignatureProducts products={products} />
      {promo && <HolidayBanner promo={promo} />}
      <MembershipTeaser />
      <UpcomingEvents events={events} />
      <ReferralBanner  />
      <GoogleReviewsSection  />
      <ConchaVideoSection />
    
    </>
  );
}
