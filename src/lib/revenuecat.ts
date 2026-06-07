/**
 * RevenueCat identifiers — must match your RevenueCat dashboard.
 *
 * Dashboard setup:
 * 1. Entitlement identifier: `pro` (display name: "Trivia Dash Pro")
 * 2. Products (Google Play): `monthly`, `yearly`
 * 3. Offering "default" with packages: $rc_monthly → monthly, $rc_annual → yearly
 */
export const PRO_ENTITLEMENT_ID = 'pro';
export const PRO_ENTITLEMENT_DISPLAY_NAME = 'Trivia Dash Pro';

/** Google Play / App Store product identifiers */
export const RC_PRODUCT_MONTHLY = 'monthly';
export const RC_PRODUCT_YEARLY = 'yearly';

/** RevenueCat package lookup keys on the current offering */
export const RC_PACKAGE_MONTHLY = 'monthly';
export const RC_PACKAGE_YEARLY = 'yearly';
