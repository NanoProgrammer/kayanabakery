"use client"
import { useMemo, useState } from "react"
import { useCart } from "./context"

const SHIPPING_FEE = 10
const DELIVERY_AREAS = ["Calgary NE", "Calgary NW", "Calgary SE", "Calgary SW", "Okotoks"]

export function CartView() {
  const cart = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fulfillmentMethod, setFulfillmentMethod] = useState("pickup")
  const [city, setCity] = useState("Calgary")

  const shippingCost = fulfillmentMethod === "shipping" ? SHIPPING_FEE : 0
  const total = useMemo(() => cart.subtotal + shippingCost, [cart.subtotal, shippingCost])

  async function handleCheckout() {
    try {
      setLoading(true); setError("")
      const payload = {
        items: cart.items.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), qty: Number(item.qty) })),
        fulfillmentMethod,
        ...(fulfillmentMethod === "shipping" ? { shippingAddress: { locality: city } } : {}),
      }
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Checkout failed")
      if (!data?.url) throw new Error("Missing checkout URL")
      window.location.href = data.url
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout failed") }
    finally { setLoading(false) }
  }

  if (!cart.isReady) return (
    <div className="mt-10"><div className="vault-card p-8">
      <div className="text-purple-300/60 flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500"></div>Loading cart...
      </div>
    </div></div>
  )

  return (
    <div className="mt-10">
      <div className="vault-card p-5 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-purple-500/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-purple-300">Checkout</span>
            <h1 className="mt-4 font-display text-4xl text-white">YOUR CART</h1>
            <p className="mt-2 text-sm text-white/50">Review items and choose pickup or local delivery.</p>
          </div>
          <div className="vault-card px-4 py-4 lg:min-w-[220px] lg:text-right">
            <div className="text-sm text-white/50">{cart.count} item{cart.count === 1 ? "" : "s"}</div>
            <div className="mt-1 text-2xl text-purple-300 font-semibold">${cart.subtotal.toFixed(2)} <span className="text-xs text-purple-400/50">CAD</span></div>
          </div>
        </div>

        {cart.items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-white/60 text-lg">Your cart is empty.</p>
            <a href="/shop" className="mt-6 inline-flex btn-purple text-sm">Continue Shopping</a>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_390px]">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {item.imageUrl ? (<img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-xl object-cover"/>) : (<div className="h-20 w-20 rounded-xl border border-purple-500/10 bg-purple-500/5"/>)}
                    <div>
                      <div className="text-lg text-white">{item.name}</div>
                      <div className="mt-1 text-sm text-white/40">${Number(item.price).toFixed(2)} CAD each</div>
                      <div className="mt-0.5 text-sm text-purple-300/60">Line total: ${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => cart.decrease(item.id)} className="rounded-xl border border-purple-500/20 px-3 py-2 text-white transition hover:bg-purple-500/10">−</button>
                    <div className="min-w-[28px] text-center text-white font-medium">{item.qty}</div>
                    <button onClick={() => cart.increase(item.id)} className="rounded-xl border border-purple-500/20 px-3 py-2 text-white transition hover:bg-purple-500/10">+</button>
                    <button onClick={() => cart.remove(item.id)} className="rounded-xl border border-red-400/30 px-3 py-2 text-red-300 transition hover:bg-red-500/10">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit vault-card p-5 sm:p-6">
              <div className="border-b border-purple-500/15 pb-5"><h2 className="text-xl text-white font-display tracking-wider">DELIVERY METHOD</h2></div>
              <div className="mt-5 space-y-3">
                <label className="block cursor-pointer rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-4 transition hover:border-purple-500/25">
                  <div className="flex items-start gap-3">
                    <input type="radio" name="fulfillment" value="pickup" checked={fulfillmentMethod === "pickup"} onChange={() => setFulfillmentMethod("pickup")} className="mt-1 accent-purple-500"/>
                    <div><div className="text-base text-white">Pickup in store</div><div className="mt-1 text-sm text-white/40">Free — Crossroads Market or 17 Ave SW</div></div>
                  </div>
                </label>
                <label className="block cursor-pointer rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-4 transition hover:border-purple-500/25">
                  <div className="flex items-start gap-3">
                    <input type="radio" name="fulfillment" value="shipping" checked={fulfillmentMethod === "shipping"} onChange={() => setFulfillmentMethod("shipping")} className="mt-1 accent-purple-500"/>
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-3"><span className="text-base text-white">Calgary area shipping</span><span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-xs text-purple-200">+$10</span></div>
                      <div className="mt-1 text-sm text-white/40">Flat-rate local delivery</div>
                    </div>
                  </div>
                </label>
              </div>
              {fulfillmentMethod === "shipping" && (
                <div className="mt-5 rounded-2xl border border-purple-400/20 bg-purple-500/5 p-4">
                  <label className="block"><span className="mb-2 block text-sm text-white/60">Delivery area</span>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border border-purple-500/20 bg-[#0a0515] px-4 py-3 text-white outline-none transition focus:border-purple-500/50">
                      {DELIVERY_AREAS.map((area) => (<option key={area} value={area}>{area}</option>))}
                    </select>
                  </label>
                </div>
              )}
              {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              <div className="mt-6 space-y-3 border-t border-purple-500/15 pt-5">
                <div className="flex items-center justify-between text-sm text-white/40"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-sm text-white/40"><span>{fulfillmentMethod === "pickup" ? "Pickup" : "Shipping"}</span><span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span></div>
                <div className="flex items-center justify-between border-t border-purple-500/15 pt-3"><span className="text-base text-white">Total (CAD)</span><span className="text-2xl text-purple-300 font-semibold">${total.toFixed(2)}</span></div>
              </div>
              <button onClick={handleCheckout} disabled={loading} className="mt-6 w-full btn-purple-solid py-3 disabled:opacity-50">
                {loading ? "Redirecting to Square..." : "Checkout with Square"}
              </button>
              <div className="mt-4 rounded-xl border border-purple-500/10 bg-purple-500/[0.03] p-4 text-xs text-white/40 leading-relaxed">
                <p className="font-semibold text-white/50 mb-2">Return & Exchange Policy</p>
                <p><span className="text-purple-300/60">Trading Cards & Collectibles:</span> All sales final on Pokémon cards, sealed TCG products, graded cards, collectibles, and consignment items.</p>
                <p className="mt-1.5"><span className="text-purple-300/60">Video Games:</span> Used games — 7-day defective exchange (same title, receipt required). New games must be factory sealed.</p>
                <p className="mt-1.5"><span className="text-purple-300/60">Consoles & Electronics:</span> 14-day hardware warranty against defects. Exchange or store credit only.</p>
                <p className="mt-1.5">No cash refunds. Store credit at management's discretion. <a href="/return-policy" className="text-purple-400 hover:text-purple-300 underline">Full policy →</a></p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}