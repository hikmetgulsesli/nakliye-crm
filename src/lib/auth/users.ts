import { compare, hash } from "bcryptjs";
import pool from "@/db/connection";
import type { User } from "@/types/index";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_active = true",
    [email]
  );
  return result.rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1 AND is_active = true",
    [id]
  );
  return result.rows[0] ?? null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role?: "admin" | "user";
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.email, passwordHash, input.fullName, input.role ?? "user"]
  );
  
  if (result.rows.length === 0) {
    throw new Error("Failed to create user");
  }
  
  return result.rows[0];
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
