"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-zinc-300 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
    >
      Logga ut
    </button>
  );
}
