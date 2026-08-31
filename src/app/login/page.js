"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
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
    <div className="min-h-screen flex items-center justify-center bg-stone-slate px-4">
      <div className="w-full max-w-sm bg-stone-parchment rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          {mode === "signup" ? "Create an account" : "Sign in"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-umber mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-stone-grey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-juniper"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-umber mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-stone-grey px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-juniper"
            />
          </div>

          {message && <p className="text-sm text-amber-rust">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-hunter text-stone-parchment rounded-md py-2 font-medium hover:bg-forest-deep disabled:opacity-50"
          >
            {loading ? "..." : mode === "signup" ? "Sign up" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setMessage("");
          }}
          className="mt-4 text-sm text-forest-hunter hover:underline w-full text-center"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
