"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
import { createBusinessProfile } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    businessName: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    country: "Nigeria",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const result = await createBusinessProfile({
      businessName: form.businessName,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      planType: "trial",
      country: form.country,
    });

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4 py-10">
      <Card className="w-full max-w-md bg-ink-900 border-ink-700">
        <h1 className="font-display text-2xl text-paper-50 mb-1">Start your 7-day trial</h1>
        <p className="text-sm text-paper-200/70 mb-6">No card needed. Full access, free.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-paper-200/80">Business name</Label>
            <Input required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="bg-ink-800 border-ink-700 text-paper-50" />
          </div>
          <div>
            <Label className="text-paper-200/80">Your full name</Label>
            <Input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="bg-ink-800 border-ink-700 text-paper-50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-paper-200/80">Country</Label>
              <select
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-800 text-paper-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brass-400"
              >
                {Object.keys(SUPPORTED_COUNTRIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-paper-200/80">Phone</Label>
              <Input required value={form.phone} onChange={(e) => update("phone", e.target.value)} className="bg-ink-800 border-ink-700 text-paper-50" />
            </div>
          </div>
          <div>
            <Label className="text-paper-200/80">Email</Label>
            <Input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-ink-800 border-ink-700 text-paper-50" />
          </div>
          <div>
            <Label className="text-paper-200/80">Password</Label>
            <Input type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} className="bg-ink-800 border-ink-700 text-paper-50" />
          </div>

          {error && <p className="text-sm text-ruby-500">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating your account…" : "Start free trial"}
          </Button>
        </form>

        <p className="text-sm text-paper-200/60 mt-6 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-brass-400 hover:underline">Log in</a>
        </p>
      </Card>
    </div>
  );
}
