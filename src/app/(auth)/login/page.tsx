"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Step 1: bridge legacy bcrypt accounts into Supabase Auth on first
      // login (no-op if already migrated, or if this isn't a legacy email).
      const bridgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/legacy-login`;
      const bridgeRes = await fetch(bridgeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const bridge = await bridgeRes.json();
      if (bridge.error) {
        setError(bridge.error);
        setLoading(false);
        return;
      }

      // Step 2: normal Supabase Auth sign-in.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <Card className="w-full max-w-sm bg-ink-900 border-ink-700">
        <h1 className="font-display text-2xl text-paper-50 mb-1">BizTrack-OS</h1>
        <p className="text-sm text-paper-200/70 mb-6">Log in to your business.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-paper-200/80">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-ink-800 border-ink-700 text-paper-50"
            />
          </div>
          <div>
            <Label className="text-paper-200/80">Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-ink-800 border-ink-700 text-paper-50"
            />
          </div>

          {error && <p className="text-sm text-ruby-500">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-paper-200/60 mt-6 text-center">
          New here?{" "}
          <a href="/signup" className="text-brass-400 hover:underline">
            Create your business account
          </a>
        </p>
      </Card>
    </div>
  );
}
