"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Truck, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-[480px] p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 animate-pulse">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded mb-8"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe.toString(),
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setLoginError("Invalid email or password");
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setLoginError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(to right bottom, rgba(246, 246, 248, 0.9), rgba(246, 246, 248, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAyb_Rhvmny0b6kVZzTeo2gWaShGWULcKe1sxBevg5sNdRYOHhGbEL5y2glIhlqjWxF6XAJTwKuZgOp74juYEHZLi5axORZoSrsnkFzf0a7FyEpmujr0CJt2twzOyKJgYm2wOn2Ot_jxE0Lpmoq-Ke4J7LbAqD4IKqPv4KiJAMDCYGD9wQWrk-pXBthDw6pqwOLh5c6WB06yacbiDgGxYiGMbJfePCNvd8uv-x_tiYMDyx98R8-meAdRJAruOTFkB_Bx0yzNLy_9syN')`,
      }}
    >
      <div className="w-full max-w-[480px] p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 p-8 flex flex-col">
          {/* Branding */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="text-primary flex items-center justify-center">
              <Truck className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              GlobalShip CRM
            </h1>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Log in to your International Shipping CRM account
            </p>
          </div>

          {/* Error Message */}
          {(error || loginError) && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error === "CredentialsSignin" || loginError
                ? "Invalid email or password"
                : "An error occurred. Please try again."}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary bg-white dark:bg-slate-700 dark:border-slate-600"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-slate-600 dark:text-slate-400"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              Don&apos;t have an account?{" "}
              <a
                href="#"
                className="font-medium text-primary hover:text-primary/80"
              >
                Contact Admin
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          © 2024 GlobalShip Logistics CRM. All rights reserved.
        </div>
      </div>
    </div>
  );
}
