"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const handle = async () => {
      const supabase = createClient();

      // --- Flow 1: hash fragment (recovery / implicit grant) ---
      const hash = window.location.hash.substring(1);
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const type = hashParams.get("type");

        // createBrowserClient auto-detects hash tokens and sets session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (type === "recovery") {
            router.replace("/auth/reset-password");
            return;
          }
          router.replace("/app");
          return;
        }
      }

      // --- Flow 2: PKCE / OAuth code exchange ---
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          const type = searchParams.get("type");
          if (type === "signup") {
            router.replace("/auth/confirmed");
            return;
          }
          router.replace(searchParams.get("next") ?? "/app");
          return;
        }
      }

      // --- Flow 3: token_hash OTP verification ---
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "email" | "recovery",
        });
        if (!error) {
          if (type === "recovery") {
            router.replace("/auth/reset-password");
            return;
          }
          router.replace("/auth/confirmed");
          return;
        }
      }

      // --- Fallback: no valid params ---
      setError(true);
      router.replace("/login?error=auth");
    };

    handle();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-500">
        {error ? "Något gick fel…" : "Verifierar…"}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-500">Laddar…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
