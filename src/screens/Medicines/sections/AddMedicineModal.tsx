import { useEffect, useState } from "react";
import { CheckCircle2, Pill, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { showError } from "../../../lib/toast";
import type { CreateMedicinePayload } from "../../../data/medicines";

const TYPE_OPTIONS = [
  "Tablet",
  "Capsule",
  "Injection",
  "Syrup",
  "Inhaler",
  "Other",
] as const;

const UNIT_OPTIONS = [
  "mg",
  "ml",
  "g",
  "IU",
  "mcg",
  "%",
  "units",
  "strip",
  "box",
] as const;

interface AddMedicineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CreateMedicinePayload) => Promise<void>;
}

export const AddMedicineModal = ({
  open,
  onOpenChange,
  onSave,
}: AddMedicineModalProps): JSX.Element => {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setType("");
      setUnit("");
      setSaving(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !unit) return;
    setSaving(true);
    try {
      await onSave({
        medicineName: trimmed,
        type: type || "Other",
        unit,
      });
      onOpenChange(false);
    } catch (err) {
      showError(
        "Could not add medicine",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-lg gap-0 p-0 overflow-hidden">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 text-left space-y-0 border-b border-[#ededed]">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold text-black tracking-tight">
              <Pill
                className="h-5 w-5 shrink-0 text-primary-2"
                strokeWidth={2}
                aria-hidden
              />
              Add Medicine
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-black">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type medicine name"
                className="h-11 rounded-lg border-[#dedee1] bg-white text-base placeholder:text-x-70/80"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
              <div className="grid gap-2 min-w-0">
                <label className="text-sm font-medium text-black">Type</label>
                <Select value={type || undefined} onValueChange={setType}>
                  <SelectTrigger className="h-11 w-full rounded-lg border-[#dedee1] bg-white font-normal text-black data-[placeholder]:text-x-70/80">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 min-w-0">
                <label className="text-sm font-medium text-black">
                  Unit <span className="text-red-500">*</span>
                </label>
                <Select value={unit || undefined} onValueChange={setUnit}>
                  <SelectTrigger className="h-11 w-full rounded-lg border-[#dedee1] bg-white font-normal text-black data-[placeholder]:text-x-70/80">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-3 px-6 py-4 bg-[#f9fafb] border-t border-[#ededed] sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-10 rounded-lg border-[#dedee1] bg-white text-black hover:bg-grey-light gap-2"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !unit || saving}
              className="h-10 rounded-lg gap-2 bg-primary-2 hover:bg-primary-2/90 text-white disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
