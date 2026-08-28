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
  "/client/progress",
  "/client/nutrition",
  "/client/profile",
  "/client/messages",
];

const AUTH_PATHS = ["/login", "/register", "/client/login"];

type Role = "ADMIN" | "TRAINER" | "CLIENT";

function isPath(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getHomeForRole(role: Role | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "TRAINER") return "/dashboard";
  if (role === "CLIENT") return "/client/home";
  return "/login";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    // Match the dynamic cookie name from auth.ts:
    // __Secure- prefix is added in production/HTTPS environments.
    cookieName:
      process.env.NODE_ENV === "production" ||
      (process.env.NEXTAUTH_URL ?? "").startsWith("https://")
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
  });

  const isLoggedIn = !!token;
  const role = token?.role as Role | undefined;

  const isAuthPage = isPath(pathname, AUTH_PATHS);

  // Logged-in users on auth pages go to their own role home.
  if (isLoggedIn && isAuthPage) {
    if (role) {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
    // Token without a role: fall through and let the page handle it.
    return NextResponse.next();
  }

  // mustChangePassword enforcement lives in the client portal layout
  // (DB check, not JWT — token goes stale after the password changes).

  // Trainer-only area: anyone who is not a trainer goes to their role home.
  if (isPath(pathname, TRAINER_PATHS)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role && role !== "TRAINER") {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
  }

  // Client-only area: anyone who is not a client goes to their role home.
  if (isPath(pathname, CLIENT_PATHS)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/client/login", request.url));
    }
    if (role && role !== "CLIENT") {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
  }

  // Admin-only area: anyone who is not an admin goes to their role home.
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role && role !== "ADMIN") {
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
