"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "success">("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="mb-2 text-2xl font-bold" style={{color: '#0009AB'}}>vidder</div>
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">Lösenordet är uppdaterat!</h1>
          <p className="text-sm text-zinc-500">Öppna Vidder-appen och logga in med ditt nya lösenord.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-2xl font-bold" style={{color: '#0009AB'}}>vidder</div>
          <p className="text-sm text-zinc-500">Välj ett nytt lösenord</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nytt lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#0009AB] focus:outline-none focus:ring-1 focus:ring-[#0009AB]"
              placeholder="Minst 8 tecken"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Bekräfta lösenord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#0009AB] focus:outline-none focus:ring-1 focus:ring-[#0009AB]"
              placeholder="Upprepa lösenordet"
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{backgroundColor: '#0009AB'}}
          >
            {submitting ? "Sparar…" : "Spara nytt lösenord"}
          </button>
        </form>
      </div>
    </div>
  );
}
