import { DiscoverBreadBatch } from "@/components/admin/DiscoverBreadBatch";
import { INITIAL_BATCH_SIZE } from "@/lib/coupons/discover-bread-batch";

export const dynamic = "force-dynamic";

/**
 * Repartir los primeros cupones DESCUBREPAN.
 *
 * El cupón automático nace al comprar un pastel, así que la lista del
 * Studio empieza vacía. La junta pidió además una primera tanda de 30
 * para clientes que YA compraron pastel — esos no van a volver a
 * comprar uno solo para recibir el cupón, así que se emiten mirando
 * hacia atrás, desde aquí.
 */
export default function DiscoverBreadPage() {
  return (
    <div>
      <h2 className="font-display text-2xl">Cupones DESCUBREPAN</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Los primeros {INITIAL_BATCH_SIZE} cupones, para clientes que ya compraron
        pastel y todavía no han comprado pan. De aquí en adelante el cupón se
        crea solo cada vez que alguien compra un pastel; esta pantalla es para
        la primera tanda.
      </p>
      <DiscoverBreadBatch />
    </div>
  );
}
