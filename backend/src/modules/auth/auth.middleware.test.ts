import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";

import { USER_ROLE } from "../../shared/constants";
import { requireAdmin, requireRole } from "./auth.middleware";

// The admin subdomain (src/proxy.ts, verified separately) is routing/UX
// only - the actual authorization boundary is this middleware, applied to
// every /api/admin/* route regardless of which host the request came from.
// These exercise it directly (fake req/res/next, no HTTP server needed),
// covering the "accepted" / "rejected" cases from the plan's validation
// list for the admin feature, which otherwise had no code changes to test.
function fakeReq(role?: (typeof USER_ROLE)[keyof typeof USER_ROLE]): Request {
  return {
    user: role ? { id: "user-1", email: "user@example.com", role, plan: "free" } : undefined,
  } as unknown as Request;
}

const noopRes = {} as Response;

describe("requireAdmin", () => {
  it("accepts a request from an admin user", () => {
    const req = fakeReq(USER_ROLE.admin);
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };

    expect(() => requireAdmin(req, noopRes, next)).not.toThrow();
    expect(called).toBe(true);
  });

  it("rejects a request from a non-admin user", () => {
    const req = fakeReq(USER_ROLE.user);
    const next: NextFunction = () => {
      throw new Error("next() should not be called");
    };

    expect(() => requireAdmin(req, noopRes, next)).toThrow();
  });

  it("rejects a request with no authenticated user", () => {
    const req = fakeReq();
    const next: NextFunction = () => {
      throw new Error("next() should not be called");
    };

    expect(() => requireAdmin(req, noopRes, next)).toThrow();
  });
});

describe("requireRole", () => {
  it("accepts any role included in the allowed list", () => {
    const middleware = requireRole(USER_ROLE.user, USER_ROLE.admin);
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };

    expect(() => middleware(fakeReq(USER_ROLE.user), noopRes, next)).not.toThrow();
    expect(called).toBe(true);
  });

  it("rejects a role not included in the allowed list", () => {
    const middleware = requireRole(USER_ROLE.admin);
    const next: NextFunction = () => {
      throw new Error("next() should not be called");
    };

    expect(() => middleware(fakeReq(USER_ROLE.user), noopRes, next)).toThrow();
  });
});
