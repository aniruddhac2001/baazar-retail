import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold text-foreground">404 — Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you requested does not exist.
      </p>
      <Link
        href="/"
        className="text-sm font-medium underline underline-offset-4 hover:text-primary"
      >
        Return home
      </Link>
    </main>
  );
}
