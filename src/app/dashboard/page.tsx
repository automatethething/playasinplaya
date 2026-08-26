import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { auth, signIn } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui, sans-serif" }}>
        <h1>Sign in to access your dashboard</h1>
        <form action={async () => { "use server"; await signIn("consentkeys", { redirectTo: "/dashboard" }); }}>
          <button style={{ padding: "12px 16px", borderRadius: 12 }}>Sign in with ConsentKeys</button>
        </form>
      </main>
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: tasks } = await supabase
    .from("exampleapp_tasks")
    .select("id, title, status, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: tests } = await supabase
    .from("exampleapp_test_feedback")
    .select("id, title, test_area, status, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 12, color: "#666" }}>Dashboard</p>
      <h1 style={{ fontSize: 42, marginBottom: 8 }}>Welcome back {session.user.name || session.user.email || session.user.id}</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>Starter dashboard for tasks and agent test feedback.</p>

      <PwaInstallPrompt
        appName="Example App"
        reason="Open your saved workspace quickly from your home screen."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h2>Tasks</h2>
          {!tasks?.length ? <p>No tasks yet.</p> : tasks.map((task) => <div key={task.id}>{task.title} — {task.status}</div>)}
        </section>
        <section style={{ border: "1px solid #ddd", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h2>Feedback to test after pushes</h2>
          {!tests?.length ? <p>No agent feedback test items yet.</p> : tests.map((test) => <div key={test.id}>{test.title} — {test.test_area} — {test.status}</div>)}
        </section>
      </div>
    </main>
  );
}
