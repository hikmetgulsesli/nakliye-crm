<<<<<<< HEAD
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

=======
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

<<<<<<< HEAD
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;
=======
>>>>>>> origin/feature/crm-core-modules
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
<<<<<<< HEAD

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
=======
>>>>>>> 0c55e58 (feat: US-014 - User dashboard with personal metrics)

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];
  
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check for session cookie
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
>>>>>>> origin/feature/crm-core-modules
};
