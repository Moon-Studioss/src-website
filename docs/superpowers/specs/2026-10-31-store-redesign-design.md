# Store redesign: design spec

Date: 2026-10-31 · Status: draft, waiting for review

## Goal

Make `/store` look and work like a Robocraze / Robu style shop (header with search and categories, shop front, category pages with filters, full product details, a cart that survives refresh). Ordering and payment happen **only in a WhatsApp chat**. No payment gateway, no customer accounts.

Success: a student can find a part, read its details, add it to a cart, and send a ready-typed order to the owner on WhatsApp, on a phone, in under a minute. The owner can add all 50–60 products and their photos from the admin panel.

## Decisions

- **The flip card is unchanged.** Tap flips it, Add and the quantity stepper work on both sides, as now.
- **One addition to the card:** a blue circular "i" button. It opens the product popup (the "product page") over a blurred background. It must not flip the card (same `stopPropagation` pattern the Add button uses).
- **Placement of the "i":** front face, bottom-right corner of the photo, so the price row and Add button are untouched. Back face, top-right corner. Easy to move if the owner wants it somewhere else.
- **The product page is a popup, not a route.** It opens at `/store?p=<slug>`, so the home-page parts row, shared links and the browser back button all work. Tradeoff: no standalone pages for Google. The same component can be mounted on a route later.
- **One ordering path:** popup → Add to cart → cart → WhatsApp. The popup also has an "Ask about this part" link (opens WhatsApp with a question about that product).
- **Look:** SRC navy and yellow with the references' layout. Not their colours, logos, photos or text.
- **MRP / crossed-out price** is shown only when the owner enters a real MRP. No reviews, timers, rewards, wishlist, compare or pincode checks.
- **Pickup** is offered only if the owner confirms it. Until then, delivery only.
- **No order records in admin.** WhatsApp is the order history.

## Pages and components

| Route / file | What it is |
|---|---|
| `store/layout.tsx` | Closed check (existing `isStoreClosed`), Navbar, store header, Footer, cart provider, cart bar and sheet. Fetches all products and categories **once** (≤60 rows) and puts them in context with the cart. |
| `store/page.tsx` | Shop front: banner, 4-step "how ordering works" strip, category tiles, rows (Featured, New arrivals, then up to 6 categories with "See all"). With `?q=` it shows search results instead. |
| `store/c/[slug]/page.tsx` | Category page: breadcrumb, filters, sort, grid. |
| `store/ProductCard.tsx` | The existing `FlipCard`, moved out of `StoreClient.tsx` so rows and grids share it, plus the "i" button. |
| `store/ProductPopup.tsx` | The product popup. Reads the product from context by slug, so it opens instantly. |
| `store/cart.tsx` | Cart context: add/remove, localStorage persistence, delivery details, WhatsApp message. |
| `lib/store.ts` | Pure helpers: `slugify`, filter + sort, cart reconcile, order message. One runnable check (`lib/store.check.ts`, same style as `ideas.check.ts`). |

`StoreClient.tsx` (366 lines, one page) is split up and removed; the header search replaces its sticky search bar.

**Store header:** logo link home, wide search bar, cart icon with count, "All categories" menu (a drawer on phones). The bottom tab bar on phones stays.

**Filters (category page):** In stock / out of stock, price range (two number inputs), brand (from the products in that category, with counts), sort (Featured, Newest, Price low to high, high to low, Name A–Z). Sidebar on desktop, a "Filters" sheet on phones. No pagination and no items-per-page, since there are ≤60 products.

**Popup contents:** photo gallery with thumbnails; category and brand; name; SKU; price (with MRP and % off only if MRP is set); stock status; key points (bullets); quantity stepper and **Add to cart** (becomes "In cart · View cart" once added); "Ask about this part"; tabs **Description** and **Specifications** (a tab or field is hidden when it has no data); up to 4 related parts from the same category (clicking one swaps the popup).

**Popup behaviour:** blurred and dimmed background (`backdrop-blur-sm`, same as the admin modals); closes on Esc, outside click or the X; locks page scroll; traps focus and returns it to the "i" button on close; `role="dialog" aria-modal`. Desktop: centred, two columns, max ~56rem. Phone: near-full-height sheet with a sticky quantity + Add bar, above the bottom tab bar. Respects reduced motion (the global rule already shortens animations).

## Ordering flow

1. Customer adds parts. The cart is saved in `localStorage` as ids and quantities and **re-checked against the current catalog on load**. Removed or out-of-stock items are dropped and prices are always the current ones.
2. The cart sheet asks for name and delivery address (with PIN code). Details are remembered for next time.
3. **Send order on WhatsApp** opens a chat with this message:

```
New order SRC-A7K2
• Arduino Uno R3 × 1 — ₹399
• SG90 Servo × 2 — ₹198
Items total: ₹597

Name: Rahul
Delivery: 12 MG Road, Vijayawada 520010
```

4. The owner confirms stock and shipping cost in the chat, shares UPI details, and dispatches after payment.

The order code is random and only a chat reference. Nothing is stored. The customer can edit the message before sending, so the owner checks prices against the store.

**Safety fix:** `NEXT_PUBLIC_WHATSAPP_NUMBER` has a fake fallback (`919999999999`) today. In production the order button is disabled with a short message instead, so no order can go to a wrong number.

## Data changes (additive, nothing removed)

- `products`: `slug` (unique), `sku`, `brand`, `mrp` (paise, optional), `highlights` (jsonb list of strings), `specs` (jsonb list of `{label, value}`).
- `product_categories`: `slug` (unique), `image` (URL).
- Existing 12 products and 6 categories get slugs from a one-off backfill. A slug is created once from the name (`-2`, `-3` for clashes) and **never changes on rename**, so links stay valid.
- The `images` column is untouched. It stores a JSON string inside jsonb and Drizzle decodes it on read. Existing quirk, leave it.
- Applied with `npm run db:push` to the database in `.env.local` (account 2). Because it is additive, old code keeps working against the new schema.

## Admin changes

- **Product form:** add Brand, SKU, MRP (optional), Highlights (one per line), Specifications (`Label: Value` per line). Add **Duplicate product** to speed up entering 50–60 similar parts.
- **Photos:** replace the "Image URLs" box with an upload (Uploadthing, up to 5 photos, 4 MB each) with remove and "make main". Pasting a URL stays as a fallback so the existing 12 products keep working. Needs the new `UPLOADTHING_TOKEN`.
- **Categories:** photo upload; slug is automatic. The category dropdown lists real categories only, instead of the hard-coded list that includes names not in the database ("Kits", "Cables & Connectors").
- **Security:** every action in `x9/store/actions.ts` first calls `verifyAdminSession()` (already in `lib/auth.ts`) and stops if not logged in. The new product-photo upload route does the same. Today the `/x9` protection only covers page requests, not the actions. The other unprotected actions in `SECURITY_AUDIT.md` stay out of this work.

## Not in this scope

Search suggestions as you type, CSV import of products, banner management in admin (the banner is a text banner in code until the owner supplies images), separate product pages for Google, orders in admin, discounts, reviews, wishlist, accounts. Each can be added later without changing this design.

## Rollout

Build in this order, each step leaves a working store:

1. Data columns, backfill, admin form, photo upload, admin security.
2. Store layout, header, cart provider (cart saved).
3. Product card with "i" button and the popup.
4. Shop front, category pages, filters, search results.
5. Cart sheet: delivery details and the new WhatsApp message.
6. Test on phone and desktop, then switch off "under construction".

`npm run dev` always shows the store, so it can be built while it stays hidden on the live site. **Do not deploy before Vercel's `DATABASE_URL` points to account 2**, or the live site will query columns that only exist there.

## Verification

- `node src/lib/store.check.ts` (slugify, filter/sort, cart reconcile, message) passes, run the same way as `ideas.check.ts`.
- Typecheck and lint pass.
- Manual run in the browser at 1440px and 390px: flip, "i" opens and closes (Esc, outside click, X, back button), `?p=` link opens the popup, filters, search, cart survives refresh, WhatsApp link text is correct, no console errors.

## Needed from the owner

Product list with real photos, brand, specs and prices; category photos; shipping charges; whether pickup is available; return and warranty wording; the final WhatsApp number in Vercel.
