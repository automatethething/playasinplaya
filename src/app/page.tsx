import { auth, signIn, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 12, color: "#666" }}>Example App</p>
      <h1 style={{ fontSize: 56, lineHeight: 1, margin: "8px 0 16px" }}>Auth + Supabase starter</h1>
      <p style={{ fontSize: 20, color: "#444", maxWidth: 720 }}>
        Replace this homepage with your actual product loop.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        {session ? (
          <>
            <Link href="/dashboard" style={{ padding: "12px 16px", border: "1px solid #ccc", borderRadius: 12, textDecoration: "none" }}>
              Open dashboard
            </Link>
            <form action={async () => { "use server"; await signOut(); }}>
              <button style={{ padding: "12px 16px", borderRadius: 12 }}>Sign out {session.user?.name || session.user?.email || session.user?.id}</button>
            </form>
          </>
        ) : (
          <form action={async () => { "use server"; await signIn("consentkeys", { redirectTo: "/dashboard" }); }}>
            <button style={{ padding: "12px 16px", borderRadius: 12 }}>Sign in with ConsentKeys</button>
          </form>
        )}
      </div>
    </main>
  );
}
