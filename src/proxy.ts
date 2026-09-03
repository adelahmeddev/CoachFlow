import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const TRAINER_PATHS = [
  "/dashboard",
  "/clients",
  "/messages",
  "/onboarding",
  "/nutrition-templates",
  "/training-split-templates",
  "/subscription-plans",
  "/settings",
];

const CLIENT_PATHS = [
  "/client/home",
  "/client/workout",
  "/client/nutrition",
  "/client/profile",
  "/client/messages",
];

const AUTH_PATHS = ["/login", "/register", "/client/login"];

type Role = "SUPER_ADMIN" | "COACH" | "CLIENT";

function isPath(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getHomeForRole(role: Role | undefined) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "COACH") return "/dashboard";
  if (role === "CLIENT") return "/client/home";
  return "/login";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let token: Record<string, unknown> | null = null
  try {
    token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === "production" ||
        (process.env.VERCEL_URL ?? "") !== "" ||
        (process.env.NEXTAUTH_URL ?? "").startsWith("https://")
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
    })) as Record<string, unknown> | null
    // Fallback: try the other cookie name (handles stale http vs https cookies)
    if (!token) {
      const fallbackName =
        process.env.NODE_ENV === "production" ||
        (process.env.VERCEL_URL ?? "") !== "" ||
        (process.env.NEXTAUTH_URL ?? "").startsWith("https://")
          ? "next-auth.session-token"
          : "__Secure-next-auth.session-token"
      token = (await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: fallbackName,
      })) as Record<string, unknown> | null
    }
  } catch {
    token = null
  }

  // If a session cookie exists but token is null/invalid (e.g. old secret, decryption failed, missing role),
  // clear both possible cookies to break redirect loops — browser will get clean session
  const hasAnySessionCookie =
    request.cookies.has("__Secure-next-auth.session-token") ||
    request.cookies.has("next-auth.session-token")
  const isTokenInvalid = !token || !((token as Record<string, unknown>).role as string | undefined)
  if (hasAnySessionCookie && isTokenInvalid) {
    // Allow login pages to render without redirect loop, but clear cookies
    const res = NextResponse.next()
    res.cookies.delete("__Secure-next-auth.session-token")
    res.cookies.delete("next-auth.session-token")
    // Also clear with proper path/domain handling
    if (isPath(pathname, AUTH_PATHS) || pathname === "/") {
      return res
    }
    // For protected pages, redirect to login after clearing
    if (
      isPath(pathname, TRAINER_PATHS) ||
      isPath(pathname, CLIENT_PATHS) ||
      pathname.startsWith("/admin")
    ) {
      const loginRes = NextResponse.redirect(new URL("/login", request.url))
      loginRes.cookies.delete("__Secure-next-auth.session-token")
      loginRes.cookies.delete("next-auth.session-token")
      return loginRes
    }
    return res
  }

  const isLoggedIn = !!token;
  const role = token?.role as Role | undefined;

  const isAuthPage = isPath(pathname, AUTH_PATHS);

  if (isLoggedIn && isAuthPage) {
    if (role) {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
    return NextResponse.next();
  }

  if (isPath(pathname, TRAINER_PATHS)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role && role !== "COACH") {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
  }

  if (isPath(pathname, CLIENT_PATHS)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/client/login", request.url));
    }
    if (role && role !== "CLIENT") {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
  }

  if (pathname === "/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!role) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
