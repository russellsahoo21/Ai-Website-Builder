import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/templates",
  "/showcase",
  "/docs",
  "/integrations",
  "/changelog",
  "/feedback(.*)",
  "/checkout(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/studio(.*)",
  "/dashboard(.*)",
  "/api/(.*)",
  "/sitemap.xml",
  "/robots.txt",
]);

const isAuthRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // If user is already authenticated and visits /login or /signup, redirect immediately to dashboard or redirect_url
  if (userId && isAuthRoute(request)) {
    const redirectUrl = request.nextUrl.searchParams.get("redirect_url");
    if (redirectUrl) {
      try {
        const parsed = new URL(redirectUrl, request.url);
        if (parsed.origin === request.nextUrl.origin) {
          return NextResponse.redirect(parsed);
        }
      } catch (e) {
        if (redirectUrl.startsWith("/")) {
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      }
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

export default proxy;
