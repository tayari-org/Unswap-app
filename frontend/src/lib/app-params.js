/**
 * app-params.js — Simplified stub (no longer depends on base44)
 *
 * Previously used to read base44-specific URL params (appId, access_token, etc.)
 * These are no longer needed. We export an empty appParams object so any
 * legacy import doesn't crash, but nothing in the new stack reads from it.
 */

export const appParams = {};
