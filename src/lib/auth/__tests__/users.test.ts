import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { hashPassword, verifyPassword, validatePassword, createUser, getUserByEmail } from "../users.js";
import { initDb, closeDb, getDb } from "../../db/index.js";

describe("Auth - Password Utilities", () => {
  it("should hash password correctly", async () => {
    const password = "testPassword123!";
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("should verify correct password", async () => {
    const password = "testPassword123!";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "testPassword123!";
    const wrongPassword = "wrongPassword456!";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(wrongPassword, hash);
    
    expect(isValid).toBe(false);
  });
});

describe("Auth - Password Validation", () => {
  it("should validate password with minimum length", () => {
    const result = validatePassword("short1!");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("8 karakter");
  });

  it("should require special character", () => {
    const result = validatePassword("Password123");
    expect(result.valid).toBe(false);
    expect(result.message).toContain("özel karakter");
  });

  it("should accept valid password", () => {
    const result = validatePassword("ValidPass123!");
    expect(result.valid).toBe(true);
  });
});

describe("Auth - User Management", () => {
  beforeAll(() => {
    // Use in-memory database for tests
    process.env.DATABASE_PATH = ":memory:";
    initDb();
  });

  afterAll(() => {
    closeDb();
  });

  beforeEach(() => {
    // Clear users table before each test
    const db = getDb();
    db.exec("DELETE FROM users");
  });

  it("should create a new user", async () => {
    const user = await createUser({
      email: "test@example.com",
      password: "TestPass123!",
      fullName: "Test User",
      role: "user",
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(user.full_name).toBe("Test User");
    expect(user.role).toBe("user");
    expect(user.is_active).toBe(1);
  });

  it("should retrieve user by email", async () => {
    await createUser({
      email: "find@example.com",
      password: "TestPass123!",
      fullName: "Find User",
    });

    const found = getUserByEmail("find@example.com");
    expect(found).toBeDefined();
    expect(found?.email).toBe("find@example.com");
    expect(found?.full_name).toBe("Find User");
  });

  it("should return null for non-existent user", () => {
    const found = getUserByEmail("nonexistent@example.com");
    expect(found).toBeNull();
  });

  it("should not retrieve inactive user", async () => {
    await createUser({
      email: "inactive@example.com",
      password: "TestPass123!",
      fullName: "Inactive User",
    });

    // Deactivate user directly
    const db = getDb();
    db.prepare("UPDATE users SET is_active = 0 WHERE email = ?").run("inactive@example.com");

    const found = getUserByEmail("inactive@example.com");
    expect(found).toBeNull();
  });
});
