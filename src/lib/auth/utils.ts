import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

export interface TokenPayload {
  sub: string;
  email: string;
  full_name: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function createToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  return token;
}
