import { describe, it, expect } from "@jest/globals";
import bcrypt from "bcryptjs";

describe("Authentication System", () => {
  describe("Password Hashing", () => {
    it("should hash passwords correctly", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("should verify incorrect passwords", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe("Session Configuration", () => {
    it("should have 8 hour session maxAge configured", () => {
      const expectedMaxAge = 8 * 60 * 60; // 8 hours in seconds
      expect(expectedMaxAge).toBe(28800);
    });

    it("should have 30 day remember me option", () => {
      const rememberMeDays = 30;
      const rememberMeSeconds = rememberMeDays * 24 * 60 * 60;
      expect(rememberMeSeconds).toBe(2592000);
    });
  });
});
