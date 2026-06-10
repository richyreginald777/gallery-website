"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handlePassword(isSignup: boolean) {
    setBusy(true);
    setMsg(null);
    const fn = isSignup
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) return setMsg(error.message);
    if (isSignup) return setMsg("Account created. You can now sign in.");
    router.push(next);
    router.refresh();
  }

  async function handleMagic() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    setMsg(error ? error.message : "Check your email for a magic link.");
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-serif text-2xl mb-6">Sign in</h1>

      <div className="space-y-3">
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode === "password" && (
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {mode === "password" ? (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => handlePassword(false)}
              className="flex-1 rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
            >
              Sign in
            </button>
            <button
              disabled={busy}
              onClick={() => handlePassword(true)}
              className="flex-1 rounded border border-neutral-300 px-3 py-2 disabled:opacity-50"
            >
              Sign up
            </button>
          </div>
        ) : (
          <button
            disabled={busy}
            onClick={handleMagic}
            className="w-full rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
          >
            Send magic link
          </button>
        )}

        <button
          onClick={() => setMode(mode === "password" ? "magic" : "password")}
          className="text-sm text-neutral-500 underline"
        >
          {mode === "password" ? "Use a magic link instead" : "Use a password instead"}
        </button>

        {msg && <p className="text-sm text-neutral-700">{msg}</p>}
      </div>
    </div>
  );
}
