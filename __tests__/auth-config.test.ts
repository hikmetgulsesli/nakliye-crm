import { describe, it, expect } from "@jest/globals";

// Mock @auth/prisma-adapter before importing authOptions
jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({} as unknown)),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { authOptions } from "@/lib/auth";
import { User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";

describe("Auth Configuration", () => {
  it("should have credentials provider configured", () => {
    const providers = authOptions.providers;
    const credentialsProvider = providers.find(
      (p) => (p as { id: string }).id === "credentials"
    );

    expect(credentialsProvider).toBeDefined();
  });

  it("should have 8 hour session maxAge", () => {
    expect(authOptions.session?.maxAge).toBe(8 * 60 * 60); // 8 hours
  });

  it("should have 8 hour JWT maxAge", () => {
    expect(authOptions.jwt?.maxAge).toBe(8 * 60 * 60); // 8 hours
  });

  it("should have custom login page", () => {
    expect(authOptions.pages?.signIn).toBe("/login");
    expect(authOptions.pages?.error).toBe("/login");
  });

  it("should use JWT session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("should have Prisma adapter configured", () => {
    expect(authOptions.adapter).toBeDefined();
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
      }

      const mockSession: SessionWithRole = {
        user: { id: "", role: "" },
        expires: new Date().toISOString(),
      };

      const mockToken: JWT = {
        id: "user-123",
        role: "ADMIN",
      };

      const result = (await sessionCallback!({
        session: mockSession,
        token: mockToken,
        user: undefined as unknown as AdapterUser,
        newSession: undefined,
        trigger: "update",
      })) as SessionWithRole;

      expect(result.user.id).toBe("user-123");
      expect(result.user.role).toBe("ADMIN");
    });
  });
});
