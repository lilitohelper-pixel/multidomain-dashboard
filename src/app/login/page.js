"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_LANGUAGES, t } from "@/lib/i18n";

function detectBrowserLanguage() {
  if (typeof navigator === "undefined") return "en";
  const code = (navigator.language || "en").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : "en";
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [lang] = useState(detectBrowserLanguage);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "confirmation_failed") {
      setMessage(t(lang, "login_confirmation_failed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard/connect-telegram` },
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage(t(lang, "login_check_email"));
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)] px-4">
      <div className="w-full max-w-sm bg-[var(--surface)] rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {mode === "signup" ? t(lang, "login_signup_title") : t(lang, "login_signin_title")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">{t(lang, "login_email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--action)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">{t(lang, "login_password")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--border-strong)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--action)]"
            />
          </div>

          {message && <p className="text-sm text-[var(--holiday-text)]">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--action)] text-[var(--action-text)] rounded-md py-2 font-medium hover:bg-[var(--action-hover)] disabled:opacity-50"
          >
            {loading ? t(lang, "login_signup_loading") : mode === "signup" ? t(lang, "login_signup_button") : t(lang, "login_signin_button")}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setMessage("");
          }}
          className="mt-4 text-sm text-[var(--action)] hover:underline w-full text-center"
        >
          {mode === "signup" ? t(lang, "login_switch_to_signin") : t(lang, "login_switch_to_signup")}
        </button>
      </div>
    </div>
  );
}
