import { compare, hash } from "bcryptjs";
import { getPool } from "@/lib/db/users";
import type { User } from "@/types/index";

const SALT_ROUNDS = 12;

// Internal type that includes password_hash for auth
interface UserWithPassword extends User {
  password_hash: string;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_active = 1",
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    role: row.role as "admin" | "user",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    password_hash: String(row.password_hash),
  };
}

export async function getUserById(id: string): Promise<UserWithPassword | null> {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1 AND is_active = 1",
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    role: row.role as "admin" | "user",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    password_hash: String(row.password_hash),
  };
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role?: "admin" | "user";
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const pool = getPool();
  const passwordHash = await hashPassword(input.password);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.email, passwordHash, input.fullName, input.role ?? "user"]
  );

  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    role: row.role as "admin" | "user",
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
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
