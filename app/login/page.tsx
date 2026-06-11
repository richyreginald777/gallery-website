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
    <div className="page">
      <div className="mx-auto max-w-sm">
        <p className="eyebrow mb-3">Welcome back</p>
        <h1 className="mb-8 font-serif text-3xl tracking-tight text-ink">
          Sign in
        </h1>

        <div className="card space-y-4 p-6">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === "password" && (
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {mode === "password" ? (
            <div className="flex gap-3">
              <button
                disabled={busy}
                onClick={() => handlePassword(false)}
                className="btn-primary flex-1"
              >
                Sign in
              </button>
              <button
                disabled={busy}
                onClick={() => handlePassword(true)}
                className="btn-ghost flex-1"
              >
                Sign up
              </button>
            </div>
          ) : (
            <button
              disabled={busy}
              onClick={handleMagic}
              className="btn-primary w-full"
            >
              Send magic link
            </button>
          )}

          <button
            onClick={() => setMode(mode === "password" ? "magic" : "password")}
            className="link-quiet text-sm"
          >
            {mode === "password"
              ? "Use a magic link instead"
              : "Use a password instead"}
          </button>

          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
