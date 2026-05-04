"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.replace("/admin/dashboard");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-10 max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Use the Supabase account marked as admin in{" "}
          <code className="rounded bg-slate-100 px-1">profiles.is_admin</code>.
        </p>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-blue-500/30 focus:ring-4"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-800">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 outline-none ring-blue-500/30 focus:ring-4"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
