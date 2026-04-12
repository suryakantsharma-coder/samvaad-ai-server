import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pill, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { showError } from "../../../lib/toast";
import type { MedicineCatalogRow } from "../../../types/medicineCatalog.type";
import { updateMedicine } from "../../../data/medicines";

const UNIT_OPTIONS: string[] = [
  "mg",
  "ml",
  "g",
  "IU",
  "mcg",
  "%",
  "units",
  "strip",
  "box",
];

interface EditMedicineModalProps {
  medicine: MedicineCatalogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: MedicineCatalogRow) => void;
}

export const EditMedicineModal = ({
  medicine,
  open,
  onOpenChange,
  onSaved,
}: EditMedicineModalProps): JSX.Element => {
  const [unit, setUnit] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const unitChoices = useMemo(() => {
    const u = medicine?.units?.trim();
    if (u && !UNIT_OPTIONS.includes(u)) {
      return [...UNIT_OPTIONS, u];
    }
    return UNIT_OPTIONS;
  }, [medicine?.units]);

  useEffect(() => {
    if (open && medicine) {
      setUnit(medicine.units || "");
    }
  }, [open, medicine]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicine || !unit.trim()) return;
    setSaving(true);
    try {
      const updated = await updateMedicine(medicine._id, {
        unit: unit.trim(),
      });
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      showError(
        "Update failed",
        err instanceof Error ? err.message : "Could not update medicine.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!medicine) return null;

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
              Edit medicine
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-6">
            <p className="text-sm text-x-70">
              <span className="font-medium text-black">{medicine.name}</span>
              {medicine.medicineId ? (
                <span className="ml-2">· {medicine.medicineId}</span>
              ) : null}
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-black">
                Unit <span className="text-red-500">*</span>
              </label>
              <Select
                value={unit || undefined}
                onValueChange={setUnit}
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-[#dedee1] bg-white font-normal text-black data-[placeholder]:text-x-70/80">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitChoices.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!unit.trim() || saving}
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
