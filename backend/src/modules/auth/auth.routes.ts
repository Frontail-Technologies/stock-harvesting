import { Router } from "express";

import { AUTH_ROUTES } from "../../shared/constants";
import { env } from "../../shared/env";
import { unauthorized } from "../../shared/errors";
import { sendData } from "../../shared/http";
import { logger } from "../../shared/logger";
import { asyncHandler, getAuthUserId, requireAuth, validate } from "../../shared/middleware";
import {
  OAUTH_PORTAL_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "../../shared/constants";
import {
  clearOauthPortalCookie,
  clearOauthStateCookie,
  clearRefreshCookie,
  getCookie,
  setOauthPortalCookie,
  setOauthStateCookie,
  setRefreshCookie,
} from "../security/cookies";
import { googleAuthUrlQuerySchema, googleCallbackQuerySchema } from "./auth.schemas";
import {
  completeGoogleLogin,
  createGoogleAuthUrl,
  getCurrentUser,
  resolveOauthDestination,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./auth.service";

export const authRouter = Router();

authRouter.get(
  AUTH_ROUTES.googleUrl,
  validate({ query: googleAuthUrlQuerySchema }),
  (req, res) => {
    const portal = (req.query as { portal?: "admin" }).portal ?? "main";
    const { state, url } = createGoogleAuthUrl();
    setOauthStateCookie(res, state);
    setOauthPortalCookie(res, portal);
    sendData(res, { url });
  }
);

authRouter.get(
  AUTH_ROUTES.googleCallback,
  validate({ query: googleCallbackQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as { code?: string; state?: string; error?: string };
    // Admin-portal logins round-trip back to the admin origin instead of
    // the main site - falls back to WEB_APP_URL if no admin host is
    // configured, so an unset ADMIN_WEB_APP_URL behaves exactly like this
    // feature doesn't exist.
    const portal = getCookie(req, OAUTH_PORTAL_COOKIE_NAME);
    const destination = resolveOauthDestination(portal, {
      webAppUrl: env.WEB_APP_URL,
      adminWebAppUrl: env.ADMIN_WEB_APP_URL,
    });

    const redirectToLogin = (reason: string) => {
      clearOauthStateCookie(res);
      clearOauthPortalCookie(res);
      return res.redirect(`${destination.origin}/login?auth=${encodeURIComponent(reason)}`);
    };

    if (query.error || !query.code || !query.state) {
      return redirectToLogin(query.error ?? "failed");
    }

    const expectedState = getCookie(req, OAUTH_STATE_COOKIE_NAME);
    if (!expectedState || expectedState !== query.state) {
      return redirectToLogin("state-mismatch");
    }

    try {
      const session = await completeGoogleLogin(query.code);
      setRefreshCookie(res, session.refreshToken);
      clearOauthStateCookie(res);
      clearOauthPortalCookie(res);
      return res.redirect(`${destination.origin}${destination.successPath}?auth=success`);
    } catch (error) {
      // Previously swallowed silently - every Google login failure landed
      // on /login?auth=failed with zero trace of why (code exchange
      // rejected, profile fetch failed, DB error on user upsert, etc).
      logger.error(
        {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Google OAuth callback failed"
      );
      return redirectToLogin("failed");
    }
  })
);

authRouter.post(AUTH_ROUTES.refresh, asyncHandler(async (req, res) => {
  const refreshToken = getCookie(req, REFRESH_COOKIE_NAME);
  if (!refreshToken) {
    throw unauthorized("Refresh token missing");
  }

  const session = await rotateRefreshToken(refreshToken);
  setRefreshCookie(res, session.refreshToken);
  sendData(res, {
    accessToken: session.accessToken,
    user: session.user,
  });
}));

authRouter.get(AUTH_ROUTES.me, requireAuth, asyncHandler(async (req, res) => {
  const user = await getCurrentUser(getAuthUserId(req));
  sendData(res, { user });
}));

authRouter.post(AUTH_ROUTES.logout, asyncHandler(async (req, res) => {
  const refreshToken = getCookie(req, REFRESH_COOKIE_NAME);
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  clearRefreshCookie(res);
  sendData(res, { ok: true });
}));
