# FilthiLink: pricing, upsell and feature handoff

For the coding agent working in the IDE. Read this whole file first, then work through the sections in order.

Repo layout: `apps/api` (Spring Boot, Java, Flyway, Postgres) and `apps/web` (Next.js).

**Important:** `apps/web/AGENTS.md` says this Next.js version has breaking changes. Before writing any web code, read the relevant guide in `apps/web/node_modules/next/dist/docs/`.

Nothing below has been compiled or run. The author had no network access to install Maven or web dependencies. Build and test everything yourself: `mvn -f apps/api verify` and the web build/lint.

---

## 0. Product decisions (already made by the owner)

- Pro costs **$3/month**, and **$30/year** is recommended ("2 months free"). The old prices were $10 and $90.
- Free allows **5 new links a month**, 1 API key, and links that expire after 30 days.
- Pro allows up to 1,000 new links a month, unlimited API keys, and links that never expire.
- Most users shorten one or two links, so the pitch for Pro is **not link volume**. The pitch is "make my important link permanent, editable, measurable and readable".
- Do not claim features that don't exist. Anything unbuilt gets a "Soon" tag (see `PlanFeature.soon` in `apps/web/lib/pricing.ts`).
- Payments are handled by Dodo. The displayed price is only text. What customers are actually charged comes from the Dodo products behind the `PREMIUM_MONTHLY` and `PREMIUM_YEARLY` env vars. **The owner must create new $3 and $30 products in Dodo and swap those env vars.** Existing subscribers stay on their old product until migrated.

---

## 1. Already done: patch `filthilink-pricing-upsell.patch`

It is committed locally on branch `pricing-upsell` (commit `408bf11`), but it was **never pushed**. If you don't have that branch, apply the patch from the repo root with `git apply filthilink-pricing-upsell.patch`.

### Backend
- **`PlanLimitService`** (new) holds the plan numbers: `FREE_MONTHLY_LINKS=5`, `PREMIUM_MONTHLY_LINKS=1000`, `FREE_API_KEYS=1`. It also has `isPremium(email)`. Subscriptions are keyed by the user's **email** in `subscription.userId`.
- **`PlanLimitExceededException`** (new) is mapped to **HTTP 402** in `GlobalExceptionHandler`.
- **`LinkService.createLink`** now counts the user's links created since the start of the current month and throws 402 at the limit. Premium links get `expiresAt = now + 100 years` (the column is NOT NULL, so "never expires" is stored this way). Free links get now + 30 days.
- **`LinkService.getUsage`** and **`GET /api/v1/links/usage`** (new) return `LinkUsageResponseDto(used, limit, premium, resetsAt)`.
- **`LinkService.makeLinksPermanent(email)`** runs from `WebhookService` when a subscription activates. It sets every link the user owns, including already-expired ones, to a 100-year expiry. It is lenient and never throws.
- **`LinkRepository`** gains `countByUserIdAndCreatedAtGreaterThanEqual` and a `@Modifying` query `extendExpiryByUserId`.
- **`ApiKeyService.createApiKey`** enforces the free limit of 1 key and throws 402 above it.
- **`Subscription.isPremium()`** now keeps Premium for a `CANCELLED` subscription until `currentPeriodEnd`. Before this it dropped access immediately, which contradicted the Settings page.
- **Bug fix:** `ApiKeyRepository.findUserById(Long)` was renamed to `findByUserId(Long)`. Spring Data parses `findUserById` as "find by id", so the key list was wrong.

### Frontend
- **`apps/web/lib/pricing.ts`** (new) is the single source of truth for prices, limits and the Free/Pro feature lists. The landing cards, Settings page and upgrade dialog all read from it.
- **`apps/web/lib/link-expiry.ts`** (new) has `isExpired`, `daysUntilExpiry`, `isPermanent` and `expiryNote`.
- **`components/upgrade-dialog.tsx`** (new) has a monthly/yearly toggle, the Pro feature list and a checkout button.
- **Links page:** a usage bar ("3 of 5 free links used this month" plus a Go Pro button), an expiry banner when links have expired or are expiring within 7 days, and a 402 handler that opens the upgrade dialog. The Create Link button also opens the upgrade dialog directly when the user is at the limit.
- **Link table:** an expiry note under each status badge.
- **Bug fix:** the dashboard marked a link "expired" whenever `expiresAt` was non-null. It now compares the date.
- **Copy:** removed the unbacked claims "24/7 dedicated support", "high-speed priority redirection" and "zero rate-limiting". Prices are now $3/$30 and the yearly badge says "2 months free".

---

## 2. To build next (agreed, not yet written)

Do these in order. Each item is independent enough to be its own commit.

### 2.1 Return `createdAt` and fix the Created column
- Add `LocalDateTime createdAt` to `LinkResponseDto`, fill it in `LinkMapperImpl.toResponseDto`, and add `createdAt: string` to `LinkResponseDto` in `apps/web/types/api.ts`.
- The "Created" column in `components/link-table.tsx` currently prints today's date for every row. Make it use `createdAt`, and add `createdAt` to the table's item type and to the mapping in `links/page.tsx`.

### 2.2 Validate destination URLs on create
- Today there is no validation, and `RedirectController` calls `URI.create(originalUrl)`, which throws (a 500) on a malformed stored URL.
- In `LinkService.createLink`, trim the input and require: non-blank, at most 255 characters (the `original_url` column is `VARCHAR(255)`), parsed with `java.net.URI`, scheme `http` or `https`, non-empty host. Throw the existing `BadRequest` with a clear message.
- Reject destinations that point at the app's own short domain (redirect loops).
- Make `RedirectController` resilient. If the stored URL doesn't parse, return 404 or 410, not 500.

### 2.3 Make the monthly limit check atomic
- Two simultaneous requests can both pass the count check and create a sixth link.
- Add `@Lock(LockModeType.PESSIMISTIC_WRITE)` to a new `UserRepository` method, for example `findByEmailForUpdate(String email)`. Call it at the top of `createLink`, which is already `@Transactional`, before counting. This serialises creation per user.
- Apply the same idea to the API key limit check in `ApiKeyService`.

### 2.4 Link editing and custom slugs (these are Pro features)
Backend:
- `PATCH /api/v1/links/{id}` with body `{ "originalUrl": "..." }`.
  - Verify the link belongs to the caller. Return 404, not 403, for other users' links.
  - Free users get a 402 with the message "Editing a link's destination is a Pro feature."
  - Reuse the validation from 2.2.
  - Return the updated `LinkResponseDto`.
- Add an optional `customSlug` to `CreateLinkRequestDto`.
  - It is Pro only. Free users get a 402.
  - Allow `[A-Za-z0-9_-]`, 3 to 32 characters.
  - Reject reserved words that collide with real routes: `api`, `actuator`, `health`, `error`, `login`, `register`, `dashboard`, `admin`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `v3`.
  - Use `ResourceConflict` (409) for a taken slug, after checking `existsByShortCode`.
  - Also handle `DataIntegrityViolationException` on the `uc_links_shortcode` unique constraint as a 409, since two different users can race. Add this handler to `GlobalExceptionHandler`.
  - Existing generated codes should not be changeable after creation.

Frontend:
- Add an optional "Custom slug" field to the create dialog. For Free users it is disabled, shows a Pro badge, and opens `UpgradeDialog` on click.
- Wire up the row **Edit** button in `link-table.tsx`, which currently does nothing. Add an `onEdit(id)` prop. For Free users, open `UpgradeDialog` with the copy "Fix a typo or move a page without breaking your link". For Pro users, open an edit dialog.
- Add `LinksService.updateLink(id, { originalUrl })`.
- In `lib/pricing.ts`, remove `soon: true` from "Edit a link's destination" and "Custom slugs" once they work.

### 2.5 Delete a link (available to all plans)
- There is currently no way to delete a link. Add `DELETE /api/v1/links/{id}`.
  - Verify ownership and return 404 for links that belong to other users.
  - Return 204 on success.
- Decide whether deleted links count toward the monthly limit. The simple and safe answer is yes, otherwise Free users can create and delete in a loop to get unlimited links. Using a soft delete (a `deleted_at` column, excluded from queries and from redirects) keeps the count honest.
- Add a Delete action to the row menu in `link-table.tsx` with a confirmation step.

---

## 3. Feature roadmap, in priority order

The aim is to beat Bitly and TinyURL on value at $3, not to copy them. Competitor prices below come from third-party comparison pages and should be re-checked on the vendors' own sites before being quoted publicly.

For reference: Bitly's cheapest paid plan is about $10/month on annual billing, and editing a destination is behind a roughly $35/month plan. TinyURL Pro is about $11/month. Short.io and T.ly start around $5. Dub is about $25 to $30.

1. **Real click events (this unlocks the analytics story).**
   - Add a Flyway migration for a `click_events` table: `link_id`, `clicked_at`, `referrer_host`, `country`, `device_type`, `browser`.
   - Write events asynchronously (`@Async` or a queue) so redirects stay fast. Don't store raw IPs or use cookies.
   - Replace the read-then-write `clickCount` increment with an atomic `UPDATE links SET click_count = click_count + 1`. The current version loses counts under concurrency.
   - Build the per-link analytics page, which currently says "Analytics are coming soon". Show clicks over time, top referrers, countries and devices. Give Free users 7 days of data and Pro 12 months, with the Pro part blurred and an upgrade button. That page is itself the upsell.
2. **Expiry reminder emails.** Email free users about 7 days before a link dies, with a "Keep this link forever" button that opens checkout. First check whether the app can send email at all. It may need a provider such as Resend. This is the strongest conversion lever for a cheap plan.
3. **Warn before expiry in-app.** Already partly done in the patch. Consider a per-link "Keep forever" action on expiring rows.
4. **QR code per link (Pro).** Generate PNG and SVG. It's cheap to build and printed QR codes are a major reason people need permanent links.
5. **Password-protected and self-destructing links (Pro).**
   - Add columns `password_hash`, `max_clicks` and `active_from`/`active_until`.
   - Show an interstitial page for password links.
   - This is expensive on competitors (Short.io about $18, Rebrandly about $32), so it is a strong hook at $3.
6. **Broken-link alerts (Pro).** A nightly job checks destinations and emails the owner if a link starts returning 404 or 5xx. Neither Bitly nor TinyURL offers it.
7. **Developer extras.** Click webhooks, a `curl` example on the pricing card, rate limits per API key with sane defaults, and an OpenAPI page.
8. **Abuse and phishing protection.** Essential for a cheap shortener, because spam gets the domain blocklisted. Add a destination blocklist, a Google Safe Browsing lookup on create, a report-link form, and per-user and per-IP rate limiting on `POST /links` and on `/{shortCode}`. There is currently no rate limiting at all.
9. **Redirect performance.** Cache `shortCode -> url` (Caffeine in-process or Redis) with a short TTL, and invalidate on edit. Then "fast redirects" becomes a claim you can actually back up.
10. **Bulk tools (Pro).** CSV import and export, and tags or folders.

Positioning idea: "privacy-first analytics". No cookies and no stored IPs means no consent banner needed.

---

## 4. Pricing and billing follow-ups

- **Decide what happens to a user's links when Pro is cancelled.** Today, Pro links last about 100 years and keep working after cancellation. That's friendly, but it removes a reason to keep paying. The alternative is to set their links to expire 30 days after the subscription lapses, with a warning email. This is an owner decision. Do not change it without asking.
- **Yearly price:** if the owner wants a "Save 25%" badge, $27/year fits. $30 with "2 months free" is recommended because Dodo's fixed fee is a smaller share of one bigger charge.
- **Fee check.** A US card on a subscription costs about $0.54 on $3 (4% + 0.5% + $0.40), leaving about $2.45. Refunds cost $1 and chargebacks cost $30, so the owner should keep refund and support handling simple. Verify these figures on Dodo's pricing page, since the payout fee was listed inconsistently.
- **One-time option to test later.** A one-off "keep this link forever" purchase at about $5 could suit casual users better than a subscription. It needs extra billing code, so only try it once the monthly plan is live.

---

## 5. Known issues, still present

- `createdAt` isn't returned by the API (see 2.1).
- The Edit button on each row does nothing (see 2.4).
- There is no endpoint to delete a link (see 2.5).
- There is no URL validation (see 2.2).
- The monthly limit check isn't atomic (see 2.3).
- Click counting is read-then-write and loses counts under concurrency (see 3.1).
- The landing and Settings copy still mention Pro analytics, edit and custom slugs as "Soon". Keep the tags honest as features land.

---

## 6. Suggested tests

- Free user: the 6th link in a month returns 402. At the start of the next month the limit resets.
- Free user: a 2nd API key returns 402, and a Pro user can create more.
- Subscription activation extends all of the user's links, including expired ones.
- A `CANCELLED` subscription with `currentPeriodEnd` in the future is still premium. After that date it isn't.
- Concurrent `createLink` calls cannot exceed the limit (after 2.3).
- URL validation rejects: empty, `ftp://`, `javascript:`, no host, over 255 characters, and the app's own domain.
- Custom slug: reserved words rejected, duplicates return 409, free users get 402.
