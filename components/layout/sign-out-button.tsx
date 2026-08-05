"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/primitives";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
