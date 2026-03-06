import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Admin-only routes
    const adminPaths = ['/users', '/settings', '/reports'];
    const isAdminPath = pathname.startsWith("/admin") || 
                        adminPaths.some(path => pathname.startsWith(path));
    
    if (isAdminPath && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Public routes that don't require authentication
        const publicPaths = ["/login", "/api/auth"];
        const isPublicPath = publicPaths.some((path) =>
          req.nextUrl.pathname.startsWith(path)
        );

        if (isPublicPath) {
          return true;
        }

        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
