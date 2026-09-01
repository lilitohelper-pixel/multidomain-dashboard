"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n";

export default function SignOutButton({ lang = "en" }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="text-[var(--nav-text)] hover:text-[var(--nav-muted)] hover:underline">
      {t(lang, "sign_out")}
    </button>
  );
}
