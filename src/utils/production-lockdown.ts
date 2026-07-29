// Legacy flag kept for older guarded components. Routes now redirect disabled
// dashboard/stocks/profile pages to scanner directly.
export const IS_PRODUCTION_LOCKDOWN = process.env.NODE_ENV === "production";
