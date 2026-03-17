import { describe, it, expect } from "@jest/globals";

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { authOptions } from "@/lib/auth";
import { User } from "next-auth";
import { JWT } from "next-auth/jwt";

describe("Auth Configuration", () => {
  it("should have credentials provider configured", () => {
    const providers = authOptions.providers;
    const credentialsProvider = providers.find(
      (p) => (p as { id: string }).id === "credentials"
    );

    expect(credentialsProvider).toBeDefined();
  });

  it("should have default 30 day session maxAge (adjusted by rememberMe)", () => {
    // Default is 30 days, but actual session duration depends on rememberMe
    expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("should have default 30 day JWT maxAge (adjusted by rememberMe)", () => {
    expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("should have custom login page", () => {
    expect(authOptions.pages?.signIn).toBe("/login");
    expect(authOptions.pages?.error).toBe("/login");
  });

  it("should use JWT session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  // PrismaAdapter is not needed for credentials-only flow
  it("should NOT have Prisma adapter (credentials-only flow)", () => {
    expect(authOptions.adapter).toBeUndefined();
  });

  describe("JWT Callback", () => {
    it("should add user data to token", async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      expect(jwtCallback).toBeDefined();

      const mockToken: JWT = {};
      const mockUser: User & { role?: string } = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "ADMIN",
      };

      const result = await jwtCallback!({
        token: mockToken,
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: "signIn",
        isNewUser: false,
        session: undefined,
      });

      expect(result.id).toBe("user-123");
      expect(result.role).toBe("ADMIN");
    });

    it("should adjust maxAge based on rememberMe", async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      
      // Test with rememberMe = true
      const tokenWithRemember: JWT = { rememberMe: true };
      const resultRemember = await jwtCallback!({
        token: tokenWithRemember,
        user: undefined as unknown as User,
        account: null,
        profile: undefined,
        trigger: "signIn",
        isNewUser: false,
        session: undefined,
      });
      expect(resultRemember.maxAge).toBe(30 * 24 * 60 * 60); // 30 days

      // Test with rememberMe = false
      const tokenWithoutRemember: JWT = { rememberMe: false };
      const resultNoRemember = await jwtCallback!({
        token: tokenWithoutRemember,
        user: undefined as unknown as User,
        account: null,
        profile: undefined,
        trigger: "signIn",
        isNewUser: false,
        session: undefined,
      });
      expect(resultNoRemember.maxAge).toBe(8 * 60 * 60); // 8 hours
    });
  });

  describe("Session Callback", () => {
    it("should add token data to session", async () => {
      const sessionCallback = authOptions.callbacks?.session;
      expect(sessionCallback).toBeDefined();

      interface SessionWithRole {
        user: {
          id: string;
          role: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
        };
        expires: string;
        rememberMe?: boolean;
      }

      const mockSession: SessionWithRole = {
        user: { id: "", role: "" },
        expires: new Date().toISOString(),
      };

      const mockToken: JWT = {
        id: "user-123",
        role: "ADMIN",
        rememberMe: true,
      };

      const result = (await sessionCallback!({
        session: mockSession,
        token: mockToken,
        user: { id: "user-123", email: "test@example.com", emailVerified: new Date() },
        newSession: undefined,
        trigger: "update",
      })) as SessionWithRole;

      expect(result.user.id).toBe("user-123");
      expect(result.user.role).toBe("ADMIN");
      expect(result.rememberMe).toBe(true);
    });
  });
});
