import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          403 - Unauthorized
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          You do not have permission to access this page.
        </p>
        <Link
          href="/dashboard"
          className="text-primary hover:text-primary/80 font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
