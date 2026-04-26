import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

type Props = { products: Product[] };

export function SignatureProducts({ products }: Props) {
  if (!products?.length) return null;

  return (
    <section className="relative bg-masa/60 py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 h-1 divider-otomi opacity-40" />
      <div className="container-bakery">
        <div className="mb-14 text-center">
          <span className="eyebrow mb-3">Signature</span>
          <h2 className="section-title mx-auto max-w-2xl">
            The ones that made us{" "}
            <span className="italic text-otomi-red">famous.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink/70">
            Tried, tested, and beloved by the Calgary community. Order ahead —
            these go fast.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
