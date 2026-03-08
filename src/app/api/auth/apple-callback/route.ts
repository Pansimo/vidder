import { NextResponse } from "next/server";

// Apple POSTs the authorization result (id_token, code, user) to this endpoint.
// We extract the id_token and redirect to the login page which completes the
// sign-in via supabase.auth.signInWithIdToken on the client side.
export async function POST(request: Request) {
  const formData = await request.formData();
  const idToken = formData.get("id_token") as string | null;
  const user = formData.get("user") as string | null; // Only on first sign-in
  const { origin } = new URL(request.url);

  if (!idToken) {
    return NextResponse.redirect(`${origin}/login?error=apple`);
  }

  // Pass id_token via URL fragment (not exposed to server logs) to the login
  // page which will call signInWithIdToken client-side.
  const params = new URLSearchParams({ apple_id_token: idToken });
  if (user) params.set("apple_user", user);

  return NextResponse.redirect(`${origin}/login?${params.toString()}`);
}
