# Raafat Furniture — Google Stitch design briefs

One brief per page. **Paste the "Brand system" block first** (or set it as Stitch's project style), then paste the page prompt under it. Generate each page in **both a dark and a light variant** and in a **desktop + mobile** frame.

---

## Brand system (prepend to every page prompt)

> Brand: **Raafat Furniture**, a luxury furniture house in Egypt. Bilingual (English LTR + Arabic RTL). The aesthetic is **"The Gilded Atelier": elegant, timeless-but-modern, premium, warm — quietly confident, never loud.** The furniture photography is always the hero; the UI recedes around it.
>
> Palette: **midnight navy `#14213D`** as the anchor/velvet backdrop, **champagne gold `#E8C547`** (a brighter `#F0B429` in dark mode) used sparingly as an accent on ≤10% of the screen — gilt on dark wood, never a wash. Light theme on a clean near-white; dark theme on a charcoal `#1A202C`. Text on gold is always navy ink, never white.
>
> Type: display/headings in **Cormorant Garamond** (a high-contrast serif); body, prices, labels and UI in **Inter**; Arabic in **Cairo**. Big serif headlines, generous spacing, calm rhythm.
>
> Shape & surface: soft **rounded-luxe** corners (pill buttons, ~24px cards, ~12px fields). Elements are defined entirely by **soft, gently-frosted raised surfaces, rounded corners, and quiet shadows** — a faint translucent fill with a touch of blur sets each card, field and chip apart from the page. Cards, inputs, and chips read as light glass tiles. Gold lives as a fill on primary buttons, as small accents, and as a soft focus glow.
>
> Motion: smooth, premium, ease-out (no bounce). Subtle scroll reveals, a parallax hero, a hover lift on cards, a gold "shine" sweep on key surfaces.
>
> Avoid: cream/beige backgrounds, tiny uppercase tracked eyebrows above sections, identical icon-card grids, gradient text, decorative glass everywhere, numbered "01/02/03" section markers. It must NOT look AI-generated or like a generic IKEA/big-box store.

---

## 1. Home / Landing  (route `/`)

**Feel:** walking into a candle-lit luxury showroom — cinematic, warm, confident. First impression = desire.

**Prompt:**
> Design a luxury furniture **landing page**. **Hero**: full-viewport-height, a single cinematic furniture-interior photograph with a dark navy gradient scrim, a large centered Cormorant serif headline ("The Future of Design"), a one-line subtitle, and a single **gold pill button that reads "EXPLORE" which expands into a search field when clicked**. A subtle scroll-down cue at the bottom. The top navigation sits **transparent over the hero in white**, then turns into a frosted-glass bar on scroll.
> Below the hero, a **"Featured Collections" section**: a clean centered serif heading, then a responsive grid (2 cols mobile, 4 desktop) of category cards. Each card is a tall 4:5 furniture image on a midnight-navy mount with a soft gradient at the bottom, the category name in serif, and a small gold circular arrow that appears on hover (image zooms slightly). The "Featured Collections" heading behaves as a **sticky bar** — as the section scrolls, the heading rises with it and, on meeting the top of the screen, settles into a **frosted-glass bar that stays pinned there for the length of the section**, then releases as the grid ends. The frosted bar is defined by blur and a soft shadow. The section closes with a single centered **"Explore the collections" gold pill button** beneath the grid.
> Next, an **"Our Branches" section**: a serif heading, then three **location cards** (branch name, address, opening hours) that **arrive with a staggered scroll-in animation**, with the **phone number set elegantly beneath the cards**.
> Footer on deep navy: brand mark, a compact echo of the branch cards + phone, and legal links. Keep it editorial and image-led; gold only as small accents. Show a dark and a light version.

---

## 2. Shop / Catalog  (route `/shop`)

**Feel:** an elegant gallery you browse calmly — generous whitespace, furniture front and center, filtering that feels effortless.

**Prompt:**
> Design a **furniture shop / catalog page**. Top: a page title ("Shop") and a **large rounded search field** (a gold magnifier icon on a soft frosted surface that lifts with a gentle gold glow when focused). Left sidebar (desktop) / collapsible sheet (mobile): a **Categories list** (Living Room, Bedroom, Dining Room, Office, Outdoor, etc.) and a **Filters panel** with sort (relevance / price low-high / high-low), a dual-thumb price-range slider with gold thumbs, and color swatches. Selected filter = a gold **fill** chip with navy text.
> Main area: when a category is chosen it leads with that category's name as a serif heading (with a subcategory row where relevant) and shows its pieces; choosing another category swaps the grid with a smooth crossfade, and the view always reflects exactly the one active category. The grid is responsive (2 cols mobile → 4–5 desktop). Each product card = a tall furniture photo with rounded corners, a heart wishlist button top-right, an optional small "3D · AR" badge top-left, then below the image the product name in serif, the price in gold (or "Price on Request"), and a quick "Add to Cart" gold-fill button that fades in on hover. Cards lift gently on hover. Include an elegant empty/no-results state with a "Clear filters" action. Show dark + light.

---

## 3. Product Details  (route `/product/:id`)

**Feel:** a museum plinth for one object — the piece is the star, with tactile 3D/AR and material choices.

**Prompt:**
> Design a **product detail page** for a luxury furniture item. Two-column on desktop, stacked on mobile. **Left (sticky)**: a large media viewer on a midnight-navy rounded mount. A small pill toggle switches between **"3D & AR"** (an interactive 3D model viewer with orbit controls, a floating "View in your space" AR button, and a row of round material/color swatches to switch finishes live) and **"Photos"** (a swipeable image gallery with dot indicators). A heart wishlist button overlays the corner.
> **Right**: a small navy category tag, the product name in a large Cormorant serif, the price in gold, a calm paragraph of description, then **material and color selectors as soft pill chips** (selected = a gold fill with navy text), a dimensions line, and an optional "custom dimensions" field for made-to-order. Primary actions: a wide gold "Add to Cart" pill and a secondary "Save" button on a soft surface. Premium, lots of breathing room. Dark + light.

---

## 4. Cart  (slide-over drawer overlay)

**Feel:** a quiet concierge panel — frictionless, clear totals, easy to keep shopping.

**Prompt:**
> Design a **shopping cart slide-over drawer** that slides in from the side over a dimmed, blurred backdrop. Header with a "Your Cart" serif title and a close button. A scrollable list of line items: thumbnail, product name, chosen color/material, a rounded quantity stepper on a soft surface, price, and "save for later" / remove actions. A separate dimmed "Saved for later" group below. Pinned footer: subtotal, a small "shipping calculated at checkout" note, a wide gold "Checkout" pill (navy text), and a secondary "Close" button. The panel content scrolls smoothly within the drawer and floats cleanly above everything else. Dark + light.

---

## 5. Checkout  (route `/checkout`)

**Feel:** trustworthy and calm — a boutique transaction, not a busy form.

**Prompt:**
> Design a **checkout page**. Two columns on desktop: a wide **form column** and a sticky **order-summary card**. Form, in clear sections with serif sub-headings: (1) **How to receive it** — three large soft selectable tiles "Store pickup / Delivery / Custom order" (the chosen one carries a subtle tinted fill and soft elevation); (2) **Your details** — full name, email, phone on soft frosted fields; (3) a **Delivery address** block that appears only for delivery; (4) **Payment** — soft selectable options "Pay by card / Cash on pickup / Cash on delivery / Bank transfer", plus a note field. Summary card: item list with thumbnails, subtotal, shipping line, a bold gold total, a wide gold "Pay now / Place order" pill with a small lock icon, and a "Secure checkout" reassurance line. Refined, uncluttered. Dark + light.

---

## 6. Order Confirmation / Receipt  (route `/order/confirmation`)

**Feel:** a gracious thank-you — celebratory but understated, like a handwritten note.

**Prompt:**
> Design an **order confirmation page**. Centered column. A gold check icon that animates in, a small "Order confirmed" label, a large serif "Thank you for your order" headline, and a calm line saying a confirmation email was sent. A **receipt card**: the **order number** large in serif, status badges (e.g. "Paid", "Pickup"), the list of items with thumbnails and per-line prices, then subtotal and a bold total. Two buttons at the bottom: a soft "Continue shopping" and a gold "View my orders". Elegant, reassuring, lots of whitespace. Dark + light.

---

## 7. My Account + Orders  (route `/account`)

**Feel:** a calm personal lobby — your profile and your order history, nothing noisy.

**Prompt:**
> Design a **customer account page**. Top: a profile card with avatar, name, email, and a quiet "Sign out" action on a soft surface. Below, a "My orders" section: a vertical list of order cards, each showing a small stack of item thumbnails, the order number in serif, a status badge as a gold or green fill, the date, item count and total, and a chevron to open the order. Include an elegant empty state ("You have no orders yet" + a gold "Continue shopping" button). Refined and minimal. Dark + light.

---

## 8. Login / Sign up  (route `/login`)

**Feel:** intimate and premium — a soft glass card floating in a warm, slowly drifting glow.

**Prompt:**
> Design a **sign-in / sign-up screen**. A centered **frosted-glass card** floating over a dark background with **slowly drifting soft gold and navy blurred light blobs**. Inside the card: a small gold circular user icon, a serif "Welcome back" (or "Create your account") heading, a short subtitle, an email field and a password field (each with a leading icon on a soft frosted surface and a gold focus glow), a wide gold primary button ("Sign in"), a thin "or continue with" divider, a "Continue with Google" button (soft surface), and a text link to toggle between sign in and sign up. A back arrow top-left. One single card, no clutter. Dark + light.

---

## 9. Onboarding — name capture  (route `/onboarding`)

**Feel:** a one-step welcome — friendly, fast, no friction.

**Prompt:**
> Design a **first-time onboarding screen** that asks a new user for their first and last name. Same floating frosted-glass card and drifting-glow background as the sign-in screen. A warm serif welcome heading, a short line ("Let's set up your profile"), two soft frosted name fields and a wide gold "Continue" pill with an arrow. Minimal and inviting. Dark + light.

---

## 10. Legal — Privacy / Cookies / Terms  (route `/legal/:slug`)

**Feel:** quiet, trustworthy, readable — long-form editorial, not a wall of gray.

**Prompt:**
> Design a **legal / policy page** (Privacy Policy, Cookie Policy, Terms). A row of soft pill tabs to switch documents (active = a subtle tinted fill). A large serif document title, a "last updated" line, and an intro paragraph at a comfortable reading width (~65ch). Then clearly spaced sections, each with a serif sub-heading and easy-to-read body paragraphs with strong contrast (no faint gray text). A thin gold hairline divider between major blocks, and a "return home" link at the end. Calm, generous line spacing. Dark + light.

---

## 11. 404 — Not Found  (any unknown route)

**Feel:** graceful and on-brand, not a dead end.

**Prompt:**
> Design an elegant **404 page**. Centered: a large gold serif "404", a serif "Page not found" heading, a calm one-line explanation, and two buttons — a gold "Return home" pill and a soft "Shop" button. Optionally a faint furniture silhouette or warm glow behind. Minimal, brand-consistent. Dark + light.

---

## 12. Cookie consent banner  (global overlay)

**Feel:** respectful and quiet — present, not nagging.

**Prompt:**
> Design a **cookie consent banner** anchored to the bottom-right (full-width on mobile) as a frosted-glass card with a cookie icon, a "We value your privacy" serif title, one short sentence, a "Learn more" link, and three actions: a gold "Accept all" pill, a soft "Reject non-essential" button, and a quiet "Customize" text button. Plus a **preferences modal** with three toggle rows — "Strictly necessary" (locked on), "Analytics", "Marketing" — each with a title, a one-line description, and a gold toggle switch, and "Save preferences" / "Reject non-essential" actions. Unobtrusive, premium. Dark + light.

---

## 13. Global navigation header  (overlay, all pages)

**Feel:** invisible until needed — a thin frosted frame for the brand.

**Prompt:**
> Design a **site header**. Three-column desktop layout: left = nav links (Home, Shop, About, Contact) in serif with a gold underline-grow on hover; center = the "RAAFAT / FURNITURE" wordmark (stacked, letter-spaced); right = account icon, cart icon with a gold count badge, an EN/AR language toggle, and a light/dark theme switch. The bar is **transparent with white text over the hero on the home page**, and a **frosted-glass bar with normal text** everywhere else and on scroll; it hides on scroll-down and reappears on scroll-up. Mobile: a hamburger that opens a full-height side drawer with stacked serif links and the same controls. Dark + light.

---

## 14. Footer  (overlay, all pages)

**Feel:** a calm sign-off on deep navy.

**Prompt:**
> Design a **footer** on a deep navy/ink background. A short brand statement or wordmark, the three branch locations with hours, a phone number, and a row of links (Privacy, Cookies, Terms, Cookie settings) plus a copyright line. The three branches appear as compact location cards that animate in on scroll, with the phone number beneath them. Gold only as tiny accents (branch names, hover). Calm and spacious.

---

## 15. Admin — Catalog dashboard  (route `/admin`)

**Feel:** a clean back-office that still feels like the brand — efficient, legible, not a generic SaaS table.

**Prompt:**
> Design an **admin catalog dashboard** for a furniture store. A slim left sidebar with the logo and sections (Catalog, Archive, Logs) and a logout button; a top bar with the admin's profile and a "view store" link. Main area: a grid of **category folders**; opening one shows its products as image cards with edit/delete buttons, and a floating gold "+" button to add a listing. A **create/edit listing modal**: fields for English & Arabic name and description (with an "auto-translate" helper), category, price, **materials and colors (comma-separated)**, **dimensions**, a "made-to-order custom dimensions" toggle, and a multi-image uploader with thumbnails and a primary-image marker. Soft glass-tile surfaces throughout, gold reserved for primary actions. Dark + light.

---

## 16. Admin — Orders  (route `/admin/orders`)

**Feel:** a calm operations desk — scan, filter, act, all at a glance.

**Prompt:**
> Design an **admin orders management page**. A row of slim section tabs (Catalog / Orders / Scans). Four small summary stat cards (total orders, paid revenue, in-progress, completed) on soft surfaces. A search field plus status and fulfillment dropdowns. A list of order rows: order number in serif, customer name, date, item count, a status badge as a gold or green fill, and total. An "Export CSV" button. Clicking a row opens an **order detail modal**: status + payment + fulfillment badges, customer contact (email/phone/address), the item list with thumbnails and totals, a **status-history timeline**, a status-change control with quick-set buttons and a note field, and an internal-notes textarea. Clean, scannable, brand-tinted. Dark + light.

---

## 17. Admin — Scans & 3D models  (route `/admin/scans`)

**Feel:** a quietly futuristic studio tool — capture, process, attach.

**Prompt:**
> Design an **admin "Scans & 3D" page**. A "Scan an object" primary button that opens a **guided camera capture flow**: a full-screen live camera view with a circular progress ring guiding the user to walk 360° around an object while frames auto-capture, then a step to enter real-world width/height/depth (for accurate AR scale), then an upload/processing state. Below: an **"Attach a 3D model to a product"** panel — choose a product, paste or upload a GLB model file and an optional iOS USDZ, and define **material/color options** (each row: a label, a color picker, optional target material name) so customers can switch finishes. Then a **list of scan jobs** with status (capturing / queued / processing / ready / failed), frame count, dimensions, and a "use model" action. Modern, soft surfaces, gold accents. Dark + light.

---

### Notes for whoever builds these in Stitch
- Generate **both Arabic (RTL) and English (LTR)** for the customer-facing pages; the layout mirrors and the font becomes Cairo in Arabic.
- Keep gold to small accents and primary-button fills only. If Stitch adds gold outlines, cream backgrounds, uppercase eyebrows, or identical icon-card grids, regenerate — those are off-brand.
- Real furniture photography (or convincing placeholders) in every image slot; never flat colored blocks where a photo belongs.
