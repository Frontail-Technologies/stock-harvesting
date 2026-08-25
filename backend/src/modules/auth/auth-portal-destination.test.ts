import { describe, expect, it } from "vitest";

import { resolveOauthDestination } from "./auth.service";

// Covers the one place that decides which frontend origin a Google login
// bounces back to (auth.routes.ts's callback handler) - a regression here
// would either strand admin logins on the main site (defeating portal
// separation) or, worse, require every deployment to configure
// ADMIN_WEB_APP_URL just to keep the existing main-site login working.
describe("resolveOauthDestination", () => {
  const config = { webAppUrl: "https://stockharvesting.com" };
  const configWithAdmin = {
    webAppUrl: "https://stockharvesting.com",
    adminWebAppUrl: "https://admin.stockharvesting.com",
  };

  it("main-site login (no portal hint) always lands on the main origin's /scanner", () => {
    expect(resolveOauthDestination(undefined, config)).toEqual({
      origin: "https://stockharvesting.com",
      successPath: "/scanner",
    });
    expect(resolveOauthDestination(undefined, configWithAdmin)).toEqual({
      origin: "https://stockharvesting.com",
      successPath: "/scanner",
    });
  });

  it("admin-portal login lands back on the admin origin's own /login, never /scanner or /admin", () => {
    expect(resolveOauthDestination("admin", configWithAdmin)).toEqual({
      origin: "https://admin.stockharvesting.com",
      successPath: "/login",
    });
  });

  it("admin-portal login falls back to the main origin when ADMIN_WEB_APP_URL is unset - never throws or strands the user", () => {
    expect(resolveOauthDestination("admin", config)).toEqual({
      origin: "https://stockharvesting.com",
      successPath: "/login",
    });
  });

  it("an unrecognized portal value is treated as the main site, not admin", () => {
    expect(resolveOauthDestination("something-else", configWithAdmin)).toEqual({
      origin: "https://stockharvesting.com",
      successPath: "/scanner",
    });
  });
});
