import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Patients } from "../../types/patient.type";
import { usePatient } from "../../contexts/PatientProvider";

const INTAKE_OPTIONS = ["Before", "After"];

export interface MedicineEntry {
  id: string;
  name: string;
  dosage: number;
  dosageUnit: string;
  duration: number;
  durationUnit: string;
  intake: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  notes: string;
  expanded: boolean;
}

export interface NewPrescriptionPayload {
  patientId: string;
  patientName: string;
  appointmentDate: string;
  followUpDays: number;
  medicines: Omit<MedicineEntry, "id" | "expanded">[];
}

interface NewPrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (payload: NewPrescriptionPayload) => void;
  onCancel?: () => void;
}

export const NewPrescriptionModal = ({
  open,
  onOpenChange,
  onSave,
  onCancel,
}: NewPrescriptionModalProps): JSX.Element => {
  const { patients, searchedPatients, handlePatient } = usePatient();
  const [selectedPatient, setSelectedPatient] = useState<Patients | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("2025-11-04");
  const [followUpDays, setFollowUpDays] = useState(7);
  const [medicines, setMedicines] = useState<MedicineEntry[]>([
    {
      id: "1",
      name: "Corex",
      dosage: 5,
      dosageUnit: "ml",
      duration: 2,
      durationUnit: "Week",
      intake: "After",
      breakfast: true,
      lunch: false,
      dinner: false,
      notes: "",
      expanded: false,
    },
    {
      id: "2",
      name: "",
      dosage: 9,
      dosageUnit: "mg",
      duration: 7,
      durationUnit: "Days",
      intake: "After",
      breakfast: true,
      lunch: false,
      dinner: false,
      notes: "",
      expanded: true,
    },
  ]);

  const toggleMedicineExpanded = (id: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, expanded: !m.expanded } : m)),
    );
  };

  const addMedicine = () => {
    setMedicines((prev) => [
      ...prev.map((m) => ({ ...m, expanded: false })),
      {
        id: String(Date.now()),
        name: "",
        dosage: 0,
        dosageUnit: "mg",
        duration: 0,
        durationUnit: "Days",
        intake: "After",
        breakfast: false,
        lunch: false,
        dinner: false,
        notes: "",
        expanded: true,
      },
    ]);
  };

  const removeMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMedicine = (id: string, updates: Partial<MedicineEntry>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
  };

  React.useEffect(() => {
    if (open) {
      handlePatient();
    }
  }, [open, handlePatient]);

  const handleSend = () => {
    if (!selectedPatient) return;
    const payload: NewPrescriptionPayload = {
      patientId: selectedPatient._id,
      patientName: selectedPatient.fullName,
      appointmentDate,
      followUpDays,
      medicines: medicines.map(({ id, expanded, ...rest }) => rest),
    };
    onSave?.(payload);
    onOpenChange(false);
  };

  const handleClose = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] w-[90vw] p-0 gap-0 rounded-[10px] border border-[#dedee1] overflow-hidden [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-[#dedee1] bg-grey-light rounded-t-[10px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-[2px] rounded-[50px] bg-white border border-[#dedee1]">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <DialogTitle className="font-title-3m text-sm font-semibold text-gray-700">
              New Prescription
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm opacity-70 hover:opacity-100 p-1"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </DialogHeader>

        <div className="px-5 py-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Patient Name */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Patient Name<span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedPatient?._id ?? ""}
              onValueChange={(id) => {
                const list = searchedPatients?.length
                  ? searchedPatients
                  : patients;
                const p = list?.find((x) => x._id === id) ?? null;
                setSelectedPatient(p);
              }}
            >
              <SelectTrigger className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                <SelectValue placeholder="Choose a patient" />
              </SelectTrigger>
              <SelectContent>
                {(searchedPatients?.length ? searchedPatients : patients)?.map(
                  (p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.fullName}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Date & Follow Up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Appointment Date<span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="h-[38px] px-4 py-2 pr-9 bg-white border border-[#dedee1] rounded-[10px] font-title-4r"
                />
                <CalendarIcon className="absolute right-3 h-4 w-4 text-x-70 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Follow Up<span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-[10px] border border-[#dedee1] overflow-hidden bg-white">
                <Input
                  type="number"
                  min={0}
                  value={followUpDays || ""}
                  onChange={(e) =>
                    setFollowUpDays(parseInt(e.target.value, 10) || 0)
                  }
                  className="h-[38px] flex-1 border-0 rounded-none focus-visible:ring-0"
                />
                <span className="flex items-center px-3 py-2 bg-grey-light border-l border-[#dedee1] font-title-4r text-black text-sm">
                  Days
                </span>
              </div>
            </div>
          </div>

          {/* Medicine Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Medicine ({medicines.length} added)
              </span>
              <Button
                type="button"
                onClick={addMedicine}
                className="h-9 px-4 bg-primary-2 hover:bg-primary-2/90 text-white text-sm font-title-4r rounded-[6px]"
              >
                + Add Medicine
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {medicines.map((med) => (
                <div
                  key={med.id}
                  className="border border-[#dedee1] rounded-[10px] overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-grey-light/50 transition-colors"
                    onClick={() => toggleMedicineExpanded(med.id)}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      {med.name ? (
                        <>
                          <span className="font-title-4m text-black">
                            {med.name}
                          </span>
                          <span className="font-title-5l text-x-70 text-xs">
                            • {med.dosage} {med.dosageUnit} • {med.duration}{" "}
                            {med.durationUnit}
                          </span>
                        </>
                      ) : (
                        <span className="font-title-4m text-black">
                          Medicine Name
                        </span>
                      )}
                      {!med.name && (
                        <span className="font-title-5l text-x-70 text-xs">
                          • mg • Days
                        </span>
                      )}
                    </div>
                    {med.expanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                    )}
                  </button>

                  {med.expanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-[#dedee1] space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="font-title-4m text-black text-sm">
                          Medicine Name<span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="Type name"
                          value={med.name}
                          onChange={(e) =>
                            updateMedicine(med.id, { name: e.target.value })
                          }
                          className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m text-black text-sm">
                            Dosage<span className="text-red-500">*</span>
                          </label>
                          <div className="flex rounded-[10px] border border-[#dedee1] overflow-hidden bg-white">
                            <Input
                              type="number"
                              min={0}
                              value={med.dosage || ""}
                              onChange={(e) =>
                                updateMedicine(med.id, {
                                  dosage: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="h-[38px] flex-1 border-0 rounded-none focus-visible:ring-0"
                            />
                            <span className="flex items-center px-3 py-2 bg-grey-light border-l border-[#dedee1] font-title-4r text-black text-sm min-w-[40px] justify-center">
                              {med.dosageUnit}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m text-black text-sm">
                            Duration<span className="text-red-500">*</span>
                          </label>
                          <div className="flex rounded-[10px] border border-[#dedee1] overflow-hidden bg-white">
                            <Input
                              type="number"
                              min={0}
                              value={med.duration || ""}
                              onChange={(e) =>
                                updateMedicine(med.id, {
                                  duration: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="h-[38px] flex-1 border-0 rounded-none focus-visible:ring-0"
                            />
                            <span className="flex items-center px-3 py-2 bg-grey-light border-l border-[#dedee1] font-title-4r text-black text-sm min-w-[45px] justify-center">
                              {med.durationUnit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-title-4m text-black text-sm">
                          Intake<span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <Select
                            value={med.intake}
                            onValueChange={(v) =>
                              updateMedicine(med.id, { intake: v })
                            }
                          >
                            <SelectTrigger className="h-[38px] w-[100px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INTAKE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-4">
                            {[
                              {
                                key: "breakfast" as const,
                                label: "Breakfast",
                              },
                              { key: "lunch" as const, label: "Lunch" },
                              { key: "dinner" as const, label: "Dinner" },
                            ].map(({ key, label }) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={med[key]}
                                  onChange={(e) =>
                                    updateMedicine(med.id, {
                                      [key]: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 rounded border-gray-300 text-primary-2 focus:ring-primary-2"
                                />
                                <span className="font-title-4r text-black text-sm">
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-title-4m text-black text-sm">
                          Notes (Optional)
                        </label>
                        <Input
                          placeholder="e.g, take it daily"
                          value={med.notes}
                          onChange={(e) =>
                            updateMedicine(med.id, { notes: e.target.value })
                          }
                          className="min-h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r"
                        />
                      </div>

                      <div className="flex justify-center pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeMedicine(med.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-title-4r text-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Medicine
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[#dedee1]">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="inline-flex items-center gap-[5px] px-4 py-2 bg-grey-light hover:bg-grey-light/80 rounded-[6px] h-[44px] text-gray-600 font-title-4r"
            >
              <X className="w-5 h-5" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-[5px] px-4 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[6px] h-[44px] text-white font-title-4r"
            >
              <Send className="w-5 h-5" />
              Send Prescription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
