/**
 * Single source of truth for plan prices, limits and the feature lists shown on the
 * pricing cards, the upgrade dialog and the settings page.
 *
 * Limits must match PlanLimitService.java in the API. The prices here are display-only:
 * what a customer is actually charged is set by the Dodo products behind the
 * PREMIUM_MONTHLY / PREMIUM_YEARLY environment variables.
 */
export const PRICING = {
  monthly: 3,
  yearly: 30,
  freeLinksPerMonth: 5,
  proLinksPerMonth: 1000,
  freeApiKeys: 1,
} as const;

/** Yearly price per month, e.g. "2.50". */
export const yearlyPerMonth = (PRICING.yearly / 12).toFixed(2);

/** Percent saved by paying yearly instead of monthly, e.g. 17. */
export const yearlySavingsPercent = Math.round(
  (1 - PRICING.yearly / (PRICING.monthly * 12)) * 100,
);

export interface PlanFeature {
  label: string;
  /** Shown with a "Soon" tag. Only list things on the roadmap, never things that are live. */
  soon?: boolean;
}

export const FREE_FEATURES: PlanFeature[] = [
  { label: `${PRICING.freeLinksPerMonth} new links a month` },
  { label: 'Links stay active for 30 days' },
  { label: 'Click count on every link' },
  { label: `${PRICING.freeApiKeys} API key` },
  { label: 'No ads or interstitial pages' },
];

export const PRO_FEATURES: PlanFeature[] = [
  { label: 'Links that never expire' },
  { label: 'Restores your expired links when you upgrade' },
  {
    label: `Up to ${PRICING.proLinksPerMonth.toLocaleString('en-US')} new links a month`,
  },
  { label: 'Unlimited API keys' },
  { label: "Edit a link's destination" },
  { label: 'Custom slugs' },
  { label: 'Click analytics by source, country and device', soon: true },
];
