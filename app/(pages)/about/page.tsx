import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "About · Karyana Bakery" };

export default function AboutPage() {
  return (
    <>
      <section className="container-bakery py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <span className="eyebrow mb-3">Our story</span>
            <h1 className="font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] text-ink">
              A taste of home,{" "}
              <span className="italic text-canela">since 2018.</span>
            </h1>
            <div className="mt-8 space-y-5 text-ink/75">
              <p>
                Karyana Bakery began with a simple longing — the warm smell of
                pan dulce on Sunday mornings, the crack of a sugar-topped concha,
                the pride of baking the way abuelita taught us.
              </p>
              <p>
                Founded in Calgary in 2018, we set out to bring a piece of Mexico
                to our new home. Every loaf, every cake, every churro is
                handcrafted with the same recipes, the same patience, the same
                love we grew up with.
              </p>
              <p className="font-script text-2xl text-otomi-red">
                Más que pan, un recuerdo de hogar.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] bg-masa">
            <Image
              src="https://karyanabakery.ca/wp-content/uploads/2025/06/20241221_143840-Edited.png"
              alt="Karyana Bakery"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-masa/60 py-20 md:py-28">
        <div className="container-bakery">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              {
                title: "Handcrafted",
                text: "Every item is made by hand in small batches. No shortcuts, no industrial equipment.",
              },
              {
                title: "Fresh daily",
                text: "We bake in the morning so your pan is warm when you pick it up.",
              },
              {
                title: "From our family",
                text: "Karyana is run by a Mexican family who believe food is love, shared.",
              },
            ].map((v, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-canela/30 text-canela font-display text-xl">
                  0{i + 1}
                </div>
                <h3 className="font-display text-2xl text-ink">{v.title}</h3>
                <p className="mt-3 text-sm text-ink/70">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-bakery py-20 text-center">
        <h2 className="section-title mx-auto max-w-2xl">
          Come <span className="italic text-otomi-red">taste</span> the story.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/shop" className="btn-primary">
            Browse the menu
          </Link>
          <Link href="/contact" className="btn-ghost">
            Say hello
          </Link>
        </div>
      </section>
    </>
  );
}
