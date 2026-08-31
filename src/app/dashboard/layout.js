import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-slate">
      <header className="bg-stone-parchment border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-forest-hunter">
              Today
            </Link>
            <Link href="/dashboard/tasks" className="hover:text-forest-hunter">
              Tasks
            </Link>
            <Link href="/dashboard/expenses" className="hover:text-forest-hunter">
              Expenses
            </Link>
            <Link href="/dashboard/calendar" className="hover:text-forest-hunter">
              Calendar
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm text-stone-taupe">
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
