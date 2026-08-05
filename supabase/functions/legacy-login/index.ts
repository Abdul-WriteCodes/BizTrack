// supabase/functions/legacy-login/index.ts
//
// One-time bridge between the old bcrypt-in-`users`-table auth and real
// Supabase Auth. Called by the Next.js login form BEFORE it tries
// supabase.auth.signInWithPassword(). Flow:
//
//   1. Client submits { email, password } here first.
//   2. If `users.auth_user_id` is already set → this user has already
//      migrated. Return { migrated: true } and the client just calls
//      signInWithPassword normally.
//   3. If not yet migrated → verify `password` against the legacy
//      `password_hash` (bcrypt) using the service-role key. On success,
//      create (or find) an auth.users record for that email with THIS
//      SAME password, link it via `users.auth_user_id`, and return
//      { migrated: true }. The client then calls signInWithPassword,
//      which now succeeds against the freshly-created auth user.
//   4. On bad credentials, return { migrated: false, error: ... } — the
//      client shows a normal "wrong email or password" message.
//
// This runs with the service role — it is the ONE place in the whole
// system allowed to touch password_hash directly. Deploy with:
//   supabase functions deploy legacy-login --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return json({ migrated: false, error: "Email and password are required." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: legacyUser, error: fetchErr } = await admin
      .from("users")
      .select("user_id, business_id, email, password_hash, auth_user_id")
      .ilike("email", email)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!legacyUser) {
      // Not a legacy account — let the normal signInWithPassword flow
      // handle the "no such user" case with a generic error.
      return json({ migrated: false });
    }

    if (legacyUser.auth_user_id) {
      // Already migrated in a previous login — nothing to do here.
      return json({ migrated: true });
    }

    const valid = await bcrypt.compare(password, legacyUser.password_hash);
    if (!valid) {
      return json({ migrated: false, error: "Invalid email or password." }, 401);
    }

    // Find or create the Supabase Auth user for this email.
    let authUserId: string;
    const { data: existing } = await admin.auth.admin.listUsers({
      // small installs — fine to page; swap for a filtered lookup once
      // the user base grows past a few thousand.
      perPage: 1,
      page: 1,
    });
    const found = existing?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (found) {
      authUserId = found.id;
      // Make sure the auth password matches what they just typed.
      await admin.auth.admin.updateUserById(authUserId, { password });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      authUserId = created.user.id;
    }

    const { error: linkErr } = await admin
      .from("users")
      .update({ auth_user_id: authUserId })
      .eq("user_id", legacyUser.user_id);
    if (linkErr) throw linkErr;

    return json({ migrated: true });
  } catch (err) {
    console.error("legacy-login error:", err);
    return json({ migrated: false, error: "Something went wrong. Please try again." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
