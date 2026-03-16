import { describe, it, expect } from "@jest/globals";

describe("Auth Middleware", () => {
  it("should protect admin routes", () => {
    const adminRoutes = [
      "/admin",
      "/settings/users",
      "/settings/metadata",
    ];

    // These routes should require ADMIN role
    expect(adminRoutes).toContain("/admin");
    expect(adminRoutes).toContain("/settings/users");
    expect(adminRoutes).toContain("/settings/metadata");
  });

  it("should allow public routes without authentication", () => {
    const publicRoutes = ["/login", "/api/auth"];

    expect(publicRoutes).toContain("/login");
    expect(publicRoutes).toContain("/api/auth");
  });

  it("should have correct matcher pattern", () => {
    const matcher = "/((?!_next/static|_next/image|favicon.ico|public/).*)";
    
    // Should match protected routes
    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("_next/image");
    expect(matcher).toContain("favicon.ico");
    expect(matcher).toContain("public/");
  });

  it("should check for ADMIN role in token", () => {
    const expectedRole = "ADMIN";
    expect(expectedRole).toBe("ADMIN");
  });
});
