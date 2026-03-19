"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    if (!tokenHash || type !== "recovery") {
      setStatus("error");
      setErrorMessage("Länken har gått ut eller är ogiltig.");
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: "recovery" })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setErrorMessage("Länken har gått ut eller är ogiltig.");
        } else {
          setStatus("form");
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMessage("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Lösenorden matchar inte.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage("Kunde inte uppdatera lösenordet. Försök igen.");
      setSubmitting(false);
    } else {
      setStatus("success");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-zinc-500">Verifierar länk…</p>
        </div>
      </div>
    );
  }

  if (status === "error" && !password) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-5xl">✗</div>
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">
            Ogiltig länk
          </h1>
          <p className="text-sm text-zinc-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-5xl">✓</div>
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">
            Lösenordet är uppdaterat!
          </h1>
          <p className="text-sm text-zinc-500">
            Du kan nu logga in med ditt nya lösenord.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold" style={{ color: "#0009AB" }}>
            vidder
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Välj ett nytt lösenord</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Nytt lösenord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#0009AB] focus:outline-none focus:ring-1 focus:ring-[#0009AB]"
              placeholder="Minst 8 tecken"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 mb-1">
              Bekräfta lösenord
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#0009AB] focus:outline-none focus:ring-1 focus:ring-[#0009AB]"
              placeholder="Upprepa lösenordet"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#0009AB" }}
          >
            {submitting ? "Sparar…" : "Spara nytt lösenord"}
          </button>
        </form>
      </div>
    </div>
  );
}
