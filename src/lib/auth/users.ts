import { compare, hash } from "bcryptjs";
import { getDb } from "@/lib/db/index";
import type { User } from "@/types/index";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
  const row = stmt.get(email) as User | undefined;
  return row ?? null;
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
  const row = stmt.get(id) as User | undefined;
  return row ?? null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role?: "admin" | "user";
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const db = getDb();
  const passwordHash = await hashPassword(input.password);
  
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(input.email, passwordHash, input.fullName, input.role ?? "user");
  
  const user = getUserById(Number(result.lastInsertRowid));
  if (!user) {
    throw new Error("Failed to create user");
  }
  
  return user;
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Şifre en az 8 karakter olmalıdır" };
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Şifre en az 1 özel karakter içermelidir" };
  }
  
  return { valid: true };
}
