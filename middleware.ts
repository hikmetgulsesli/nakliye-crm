import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only routes
    const adminRoutes = [
      "/admin",
      "/settings/users",
      "/settings/metadata",
    ];

    const isAdminRoute = adminRoutes.some((route) => path.startsWith(route));

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Public routes that don't require authentication
        const publicRoutes = ["/login", "/api/auth"];
        const isPublicRoute = publicRoutes.some((route) =>
          req.nextUrl.pathname.startsWith(route)
        );

        if (isPublicRoute) {
          return true;
        }

        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
