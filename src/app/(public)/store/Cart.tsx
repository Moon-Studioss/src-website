"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Package, X } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils/helpers";
import { orderCode, orderMessage, whatsappLink } from "@/lib/store";
import { useStore, WHATSAPP_NUMBER } from "./StoreContext";
import { Stepper } from "./ProductCard";

const input = "w-full rounded-xl border border-[var(--rule)] bg-white px-3 py-2.5 text-[15px] outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)]";

// Cart bar (always reachable) + the cart sheet where the order is sent on WhatsApp.
// Payment happens in that chat; the site never takes money.
export function Cart() {
  const { lines, count, total, bump, cartOpen, setCartOpen, changeQty, details, setDetails, ordersClosed } = useStore();

  // The PIN is the last 6-digit number in the address; it has to exist before the order can go out
  const pin = details.address.match(/(?<!\d)[1-9]\d{5}(?!\d)/g)?.pop();
  const [pinCheck, setPinCheck] = useState<{ pin: string; valid: boolean | null; place?: string } | null>(null);
  useEffect(() => {
    if (!pin) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/pincode?pin=${pin}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => setPinCheck({ pin, ...d }))
        .catch(() => {});
    }, 400);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [pin]);
  const pinState = !pin ? "missing" : pinCheck?.pin !== pin ? "checking" : pinCheck.valid === false ? "bad" : "ok"; // lookup down (valid null) lets the order through
  const ready = details.name.trim().length > 1 && details.address.trim().length > 7 && pinState === "ok";
  const send = () => {
    if (ordersClosed || !WHATSAPP_NUMBER || !ready) return;
    window.open(whatsappLink(WHATSAPP_NUMBER, orderMessage(lines, details, orderCode())), "_blank", "noopener");
  };

  return (
    <>
      <AnimatePresence>
        {count > 0 && !cartOpen && (
          <motion.button
            key="cartbar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed z-40 left-4 right-4 md:left-auto md:right-6 md:w-96 bottom-[calc(var(--tab-h)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 h-14 rounded-2xl bg-[var(--ink)] text-white px-5 flex items-center justify-between font-semibold ring-1 ring-white/25"
            style={{ boxShadow: "0 16px 32px -16px rgb(22 35 58 / .7)" }}
          >
            <span className="flex items-center gap-3">
              <motion.span key={bump} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="grid place-items-center w-8 h-8 rounded-full bg-[var(--hi)] text-[var(--ink)] text-sm font-bold">
                {count}
              </motion.span>
              {formatPrice(total)}
            </span>
            <span className="inline-flex items-center gap-1.5">View cart <ShoppingBag size={18} /></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart sheet: slides up on phones, from the right on desktop */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-stretch md:justify-end" role="dialog" aria-modal="true" aria-label="Your cart">
            <motion.div
              className="absolute inset-0 bg-[var(--ink)]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              className="relative w-full md:max-w-sm max-h-[88vh] md:max-h-none md:h-full bg-white rounded-t-3xl md:rounded-none flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="md:hidden mx-auto mt-2 w-10 h-1.5 rounded-full bg-[var(--rule)]" aria-hidden />
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rule)]">
                <h2 className="font-display text-xl font-extrabold text-[var(--ink)]">Your cart ({count})</h2>
                <button onClick={() => setCartOpen(false)} aria-label="Close cart" autoFocus className="press grid place-items-center w-10 h-10 rounded-full hover:bg-[var(--paper-2)]">
                  <X size={20} />
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="flex-1 grid place-items-center px-6 py-14 text-center">
                  <div>
                    <ShoppingBag size={36} className="mx-auto mb-3 text-[var(--rule)]" />
                    <p className="font-semibold text-[var(--ink)]">Your cart is empty</p>
                    <p className="mt-1 text-sm text-[var(--mute)]">Add parts and send the order on WhatsApp.</p>
                    <Link href="/store" onClick={() => setCartOpen(false)} className="press mt-4 inline-grid place-items-center h-10 px-5 rounded-full border border-[var(--ink)] text-sm font-semibold">Browse parts</Link>
                  </div>
                </div>
              ) : (
                <>
                  <ul className="flex-1 overflow-y-auto divide-y divide-[var(--rule)]">
                    {lines.map(({ product, qty }) => {
                      const img = (product.images as string[] | null)?.[0];
                      return (
                        <li key={product.id} className="flex gap-4 px-5 py-4 items-center">
                          <div className="w-14 h-14 rounded-xl bg-[var(--paper-2)] overflow-hidden grid place-items-center shrink-0">
                            {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package size={22} className="text-[var(--mute)]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--ink)] truncate">{product.name}</p>
                            <p className="text-sm text-[var(--mute)]">{formatPrice(product.price * qty)}</p>
                          </div>
                          <Stepper qty={qty} onQty={(d) => changeQty(product, d)} name={product.name} />
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-[var(--rule)] px-5 pt-4 space-y-3 overflow-y-auto" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[var(--mute)]">Items total</span>
                      <span className="font-display text-2xl font-extrabold text-[var(--ink)]">{formatPrice(total)}</span>
                    </div>
                    <div>
                      <label htmlFor="cart-name" className="block text-sm font-semibold text-[var(--ink)] mb-1">Your name</label>
                      <input id="cart-name" autoComplete="name" className={input} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="cart-address" className="block text-sm font-semibold text-[var(--ink)] mb-1">Delivery address with PIN code</label>
                      <textarea id="cart-address" autoComplete="street-address" rows={2} className={`${input} resize-none`} value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} />
                    </div>
                    <button onClick={send} disabled={ordersClosed || !ready || !WHATSAPP_NUMBER} className="press w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-base disabled:opacity-45 disabled:cursor-not-allowed">
                      Send order on WhatsApp
                    </button>
                    <p className={`text-center ${ordersClosed || !WHATSAPP_NUMBER ? "text-sm font-bold text-red-600" : pinState === "bad" ? "text-sm font-semibold text-red-600" : "text-xs text-[var(--mute)]"}`}>
                      {ordersClosed || !WHATSAPP_NUMBER
                        ? "Ordering is not available right now. Please try again later."
                        : details.name.trim().length < 2 || details.address.trim().length < 8
                          ? "Add your name and address to send the order."
                          : pinState === "missing"
                            ? "Add your 6-digit PIN code to the address."
                            : pinState === "checking"
                              ? "Checking your PIN code…"
                              : pinState === "bad"
                                ? "This PIN code doesn't exist. Please check it."
                                : (pinCheck?.place ? `PIN ${pin}: ${pinCheck.place}. ` : "") + "WhatsApp opens with your order typed in. We confirm stock and delivery cost there, then you pay in the chat."}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
