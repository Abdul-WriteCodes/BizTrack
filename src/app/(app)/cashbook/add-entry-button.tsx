"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import ManualEntryForm from "./manual-entry-form";

export default function AddEntryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Log manual entry</Button>
      {open && <ManualEntryForm onClose={() => setOpen(false)} />}
    </>
  );
}
