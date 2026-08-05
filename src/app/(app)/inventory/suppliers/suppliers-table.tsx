"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button, Input, Label, Card } from "@/components/ui/primitives";
import Modal from "@/components/ui/modal";
import { addSupplier, updateSupplier, deleteSupplier, type SupplierInput } from "../actions";

export type SupplierRow = SupplierInput & { supplierId: string };

export default function SuppliersTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SupplierRow | null | "new">(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier?")) return;
    setDeletingId(id);
    await deleteSupplier(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>Add supplier</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {suppliers.length === 0 ? (
          <p className="text-sm text-foreground/60 p-5">No suppliers yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {suppliers.map((s) => (
              <li key={s.supplierId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-foreground/50">{s.phone}{s.notes ? ` · ${s.notes}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(s)}
                    className="p-1.5 rounded-md hover:bg-border/60 text-foreground/60"
                    aria-label={`Edit ${s.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.supplierId)}
                    disabled={deletingId === s.supplierId}
                    className="p-1.5 rounded-md hover:bg-border/60 text-ruby-500"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing === "new" && <SupplierForm onClose={() => setEditing(null)} />}
      {editing && editing !== "new" && <SupplierForm existing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SupplierForm({ existing, onClose }: { existing?: SupplierRow; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<SupplierInput>(existing ?? { name: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = existing
      ? await updateSupplier(existing.supplierId, form)
      : await addSupplier(form);
    setSaving(false);
    if (!result.success) {
      setError(result.message ?? "Something went wrong.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal title={existing ? "Edit supplier" : "Add supplier"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        {error && <p className="text-sm text-ruby-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}
