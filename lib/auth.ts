import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "boolean" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          rememberMe: credentials.rememberMe === "true",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days default (will be adjusted based on rememberMe)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days default
  },
  callbacks: {
    async jwt({ token, user, trigger, session: sessionParam }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      
      // Handle session update or initial sign in
      if (trigger === "update" && sessionParam) {
        if (sessionParam.rememberMe !== undefined) {
          token.rememberMe = sessionParam.rememberMe;
        }
      }
      
      // For credentials provider, we need to check the rememberMe from credentials
      // This is passed during sign in and stored in the token
      const rememberMe = token.rememberMe as boolean | undefined;
      
      // Set maxAge based on rememberMe
      if (rememberMe !== undefined) {
        token.maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.rememberMe = token.rememberMe;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async signIn({ user }) {
      // Update last login timestamp
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    },
  },
};
