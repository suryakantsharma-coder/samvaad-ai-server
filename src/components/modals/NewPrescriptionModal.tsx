import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  FileText,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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
import { formatTime12h } from "../../lib/dateTimeDisplay";
import { searchMedicines } from "../../data/medicines";
import type { MedicineCatalogRow } from "../../types/medicineCatalog.type";
import { getAppointments } from "../../data/appointment";
import { Appointments } from "../../types/appointment.type";
import type {
  Prescription,
  PrescriptionMedicine,
} from "../../types/prescription.type";
import { Patients } from "../../types/patient.type";
import { usePatient } from "../../contexts/PatientProvider";
import type { UpdatePrescriptionPayload } from "../../types/prescription.type";
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
  modalHeaderCloseButtonClassName,
} from "./modalFooterStyles";

const INTAKE_OPTIONS = ["Before", "After"];

const MEDICINE_SEARCH_MIN_CHARS = 1;
const MEDICINE_SEARCH_DEBOUNCE_MS = 320;

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

/** Map catalog `units` / `type` to prescription dosage unit options used in this form. */
function catalogRowToDosageUnit(row: MedicineCatalogRow): string {
  const u = row.units.trim().toLowerCase();
  if (u === "mg" || u === "ml" || u === "g") return u;
  if (u === "tablet" || u === "tablets") return "tablet";
  if (u === "capsule" || u === "capsules") return "capsule";
  const t = row.type.trim().toLowerCase();
  if (t.includes("tablet")) return "tablet";
  if (t.includes("capsule")) return "capsule";
  if (
    t.includes("syrup") ||
    t.includes("suspension") ||
    t.includes("liquid") ||
    t.includes("injection") ||
    t.includes("drops")
  ) {
    return "ml";
  }
  return "mg";
}

function tryParseDosageFromCatalogName(name: string): number | undefined {
  const m = name.match(/\b(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu)\b/i);
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function updatesFromCatalogRow(
  row: MedicineCatalogRow,
): Pick<MedicineEntry, "name" | "dosageUnit" | "dosage"> {
  const dosageUnit = catalogRowToDosageUnit(row);
  const parsed = tryParseDosageFromCatalogName(row.name);
  return {
    name: row.name,
    dosageUnit,
    ...(parsed != null ? { dosage: parsed } : {}),
  };
}

interface PrescriptionMedicineNameSearchProps {
  medicineRowId: string;
  name: string;
  expanded: boolean;
  onNameChange: (value: string) => void;
  onSelectCatalogRow: (row: MedicineCatalogRow) => void;
}

function PrescriptionMedicineNameSearch({
  medicineRowId,
  name,
  expanded,
  onNameChange,
  onSelectCatalogRow,
}: PrescriptionMedicineNameSearchProps): JSX.Element {
  const [results, setResults] = useState<MedicineCatalogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hadSearch, setHadSearch] = useState(false);
  const [noMatchHintVisible, setNoMatchHintVisible] = useState(false);
  /** After picking from the catalog, ignore the next empty search (name sync re-fetches and may return 0 rows). */
  const skipNextEmptyResultHint = useRef(false);

  useEffect(() => {
    if (!expanded) {
      setResults([]);
      setHadSearch(false);
      setLoading(false);
      setNoMatchHintVisible(false);
      return;
    }
    const q = name.trim();
    if (q.length < MEDICINE_SEARCH_MIN_CHARS) {
      setResults([]);
      setHadSearch(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setHadSearch(true);
        try {
          const { rows } = await searchMedicines(q, 1, 15);
          if (!cancelled) setResults(rows);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, MEDICINE_SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [name, expanded, medicineRowId]);

  useEffect(() => {
    if (loading) {
      setNoMatchHintVisible(false);
      return;
    }
    if (results.length > 0) {
      setNoMatchHintVisible(false);
      return;
    }
    if (
      !hadSearch ||
      !expanded ||
      name.trim().length < MEDICINE_SEARCH_MIN_CHARS
    ) {
      return;
    }
    if (skipNextEmptyResultHint.current) {
      skipNextEmptyResultHint.current = false;
      return;
    }
    setNoMatchHintVisible(true);
    const id = window.setTimeout(() => setNoMatchHintVisible(false), 2000);
    return () => window.clearTimeout(id);
  }, [loading, hadSearch, results.length, expanded, name]);

  const showDropdown =
    expanded && name.trim().length >= MEDICINE_SEARCH_MIN_CHARS;

  return (
    <div className="flex flex-col gap-2">
      <label className="font-title-4m text-black text-sm">
        Medicine name<span className="text-red-500">*</span>
      </label>
      <p className="font-title-5l text-x-70 text-xs -mt-1">
        Search the hospital catalog or type any name — if nothing matches, your
        text is used as the medicine name.
      </p>
      <div className="relative z-10">
        <div className="relative flex h-[38px] w-full items-center rounded-[10px] border border-[#dedee1] bg-white pr-10 focus-within:ring-1 focus-within:ring-ring">
          <span
            className="flex h-full w-11 shrink-0 items-center justify-center text-x-70"
            aria-hidden
          >
            <Search className="h-4 w-4" strokeWidth={2} />
          </span>
          <Input
            placeholder="Search or type medicine name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent py-2 pl-0 pr-2 shadow-none focus-visible:ring-0 rounded-none font-title-4r md:text-sm"
            autoComplete="off"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-x-70 pointer-events-none" />
          ) : null}
        </div>

        {showDropdown && (results.length > 0 || noMatchHintVisible) ? (
          <div
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] max-h-48 overflow-auto rounded-[10px] border border-[#dedee1] bg-white shadow-md"
            role="listbox"
            aria-label="Medicine catalog matches"
          >
            {results.map((row) => (
              <button
                key={row._id}
                type="button"
                role="option"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-grey-light/80 border-b border-[#dedee1] last:border-b-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  skipNextEmptyResultHint.current = true;
                  onSelectCatalogRow(row);
                  setResults([]);
                }}
              >
                <span className="font-title-4m text-black text-sm">
                  {row.name}
                </span>
                <span className="font-title-5l text-x-70 text-xs">
                  {row.type} · {row.units}
                  {row.medicineId ? ` · ${row.medicineId}` : ""}
                </span>
              </button>
            ))}
            {noMatchHintVisible && results.length === 0 ? (
              <div className="px-3 py-2.5 font-title-5l text-x-70 text-xs">
                No catalog match — continuing with &quot;{name.trim()}&quot; as
                the medicine name.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface NewPrescriptionPayload {
  patientId: string;
  patientName: string;
  appointmentId: string;
  appointmentDate: string;
  followUpDays: number;
  medicines: Omit<MedicineEntry, "id" | "expanded">[];
}

function prescriptionMedicineToEntry(
  m: PrescriptionMedicine,
  index: number,
): MedicineEntry {
  return {
    id: `edit-${index}-${m.name}`,
    name: m.name,
    dosage: m.dosage?.value ?? 0,
    dosageUnit: m.dosage?.unit ?? "mg",
    duration: m.duration?.value ?? 0,
    durationUnit: (m.duration?.unit === "Weeks"
      ? "Week"
      : m.duration?.unit === "Months"
        ? "Month"
        : "Days") as string,
    intake: m.intake ?? "After",
    breakfast: m.time?.breakfast ?? false,
    lunch: m.time?.lunch ?? false,
    dinner: m.time?.dinner ?? false,
    notes: m.notes ?? "",
    expanded: false,
  };
}

interface NewPrescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** For create mode */
  onSave?: (payload: NewPrescriptionPayload) => void | Promise<void>;
  /** For edit mode; called with prescription id and update payload */
  onUpdate?: (
    prescriptionId: string,
    payload: UpdatePrescriptionPayload,
  ) => void | Promise<void>;
  /** When set, modal opens in edit mode with form pre-filled */
  initialPrescription?: Prescription | null;
  /** When set (create mode), pre-select this patient in the dropdown */
  initialPatient?: Patients | null;
  onCancel?: () => void;
}

export const NewPrescriptionModal = ({
  open,
  onOpenChange,
  onSave,
  onUpdate,
  initialPrescription,
  initialPatient,
  onCancel,
}: NewPrescriptionModalProps): JSX.Element => {
  const isEditMode = Boolean(initialPrescription);
  const { patients, searchedPatients, handlePatient } = usePatient();
  const [selectedPatient, setSelectedPatient] = useState<Patients | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointments | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<
    Appointments[]
  >([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("2025-11-04");
  const [followUpDays, setFollowUpDays] = useState(7);
  const [medicines, setMedicines] = useState<MedicineEntry[]>([]);

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

  // Fetch patients only once when the modal opens (create mode).
  React.useEffect(() => {
    if (open && !initialPrescription) {
      handlePatient(1, 20, "all");
    }
  }, [open, initialPrescription]);

  // Pre-fill form when opening in edit mode.
  React.useEffect(() => {
    if (!open) return;
    if (initialPrescription) {
      const pid =
        typeof initialPrescription.patient === "string"
          ? initialPrescription.patient
          : initialPrescription.patient?._id ?? "";
      const pfull =
        typeof initialPrescription.patient === "object" &&
        initialPrescription.patient
          ? initialPrescription.patient.fullName
          : initialPrescription.patientName;
      const pphone =
        typeof initialPrescription.patient === "object" &&
        initialPrescription.patient?.phoneNumber
          ? initialPrescription.patient.phoneNumber
          : "";
      setSelectedPatient({
        _id: pid,
        fullName: pfull,
        phoneNumber: pphone,
        age: 0,
        gender: "Other",
        createdAt: "",
        updatedAt: "",
        reason: "",
        __v: 0,
      } as Patients);
      setSelectedAppointment(null);
      setPatientAppointments([]);
      setAppointmentDate(
        initialPrescription.appointmentDate?.slice(0, 10) ?? "2025-11-04",
      );
      setFollowUpDays(initialPrescription.followUp?.value ?? 7);
      setMedicines(
        (initialPrescription.medicines ?? []).map((m, i) =>
          prescriptionMedicineToEntry(m, i),
        ),
      );
    } else {
      if (initialPatient) {
        setSelectedPatient(initialPatient);
        setSelectedAppointment(null);
        setPatientAppointments([]);
        setAppointmentDate("2025-11-04");
        setFollowUpDays(7);
        setMedicines([]);
      } else {
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setPatientAppointments([]);
        setAppointmentDate("2025-11-04");
        setFollowUpDays(7);
        setMedicines([]);
      }
    }
  }, [open, initialPrescription?._id, initialPatient?._id]);

  // When patient is selected (create mode only), fetch their appointments for the dropdown.
  React.useEffect(() => {
    if (isEditMode || !selectedPatient) {
      if (!selectedPatient) {
        setPatientAppointments([]);
        setSelectedAppointment(null);
      }
      return;
    }
    let cancelled = false;
    setLoadingAppointments(true);
    setSelectedAppointment(null);
    getAppointments({
      page: 1,
      limit: 50,
      patientId: selectedPatient._id,
    })
      .then((res) => {
        if (!cancelled) {
          const data = (res as { data?: { appointments?: Appointments[] } })
            ?.data;
          const list = data?.appointments ?? [];
          setPatientAppointments(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (!cancelled) setPatientAppointments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAppointments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPatient?._id]);

  const handleSend = async () => {
    if (submitting) return;
    if (isEditMode && initialPrescription) {
      const updatePayload: UpdatePrescriptionPayload = {
        patientName:
          selectedPatient?.fullName ?? initialPrescription.patientName,
        appointmentDate: new Date(appointmentDate).toISOString(),
        followUp: { value: followUpDays, unit: "Days" },
        medicines: medicines.map((m) => ({
          name: m.name,
          dosage: {
            value: m.dosage,
            unit: m.dosageUnit as "mg" | "ml" | "g" | "tablet" | "capsule",
          },
          duration: {
            value: m.duration,
            unit: (m.durationUnit === "Week"
              ? "Weeks"
              : m.durationUnit === "Month"
                ? "Months"
                : "Days") as "Days" | "Weeks" | "Months",
          },
          intake: m.intake as "Before" | "After",
          time: { breakfast: m.breakfast, lunch: m.lunch, dinner: m.dinner },
          notes: m.notes || undefined,
        })),
        status: initialPrescription.status,
      };
      setSubmitting(true);
      try {
        await onUpdate?.(initialPrescription._id, updatePayload);
        onOpenChange(false);
      } catch {
        /* parent shows toast */
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!selectedPatient || !selectedAppointment) return;
    const payload: NewPrescriptionPayload = {
      patientId: selectedPatient._id,
      patientName: selectedPatient.fullName,
      appointmentId: selectedAppointment._id,
      appointmentDate,
      followUpDays,
      medicines: medicines.map(({ id, expanded, ...rest }) => rest),
    };
    setSubmitting(true);
    try {
      await Promise.resolve(onSave?.(payload));
    } catch {
      /* parent shows toast */
    } finally {
      setSubmitting(false);
    }
  };

  const canSend = isEditMode
    ? Boolean(initialPrescription)
    : Boolean(selectedPatient && selectedAppointment);

  const handleClose = () => {
    if (submitting) return;
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
              {isEditMode ? "Edit Prescription" : "New Prescription"}
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className={`${modalHeaderCloseButtonClassName} disabled:opacity-40 disabled:pointer-events-none`}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </DialogHeader>

        <div className="px-5 py-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Patient Name (read-only in edit mode) */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Patient Name<span className="text-red-500">*</span>
            </label>
            {isEditMode ? (
              <div className="h-[38px] px-4 py-2 flex items-center bg-grey-light border border-[#dedee1] rounded-[10px] font-title-4r text-black">
                {selectedPatient?.fullName ??
                  initialPrescription?.patientName ??
                  "—"}
              </div>
            ) : (
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
                  {(searchedPatients?.length
                    ? searchedPatients
                    : patients
                  )?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Appointment (create mode only; edit mode keeps appointment immutable) */}
          {!isEditMode && selectedPatient && (
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Appointment<span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedAppointment?._id ?? ""}
                onValueChange={(id) => {
                  const apt =
                    patientAppointments.find((a) => a._id === id) ?? null;
                  setSelectedAppointment(apt);
                  if (apt) {
                    setAppointmentDate(apt.appointmentDateTime.slice(0, 10));
                  }
                }}
                disabled={loadingAppointments}
              >
                <SelectTrigger className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                  <SelectValue
                    placeholder={
                      loadingAppointments
                        ? "Loading appointments..."
                        : "Choose an appointment"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {patientAppointments.map((apt) => (
                    <SelectItem key={apt._id} value={apt._id}>
                      {new Date(apt.appointmentDateTime).toLocaleDateString()} •{" "}
                      {formatTime12h(apt.appointmentDateTime)}{" "}
                      •{" "}
                      {typeof apt.doctor === "object" && apt.doctor !== null
                        ? apt.doctor.fullName ?? "—"
                        : "—"}{" "}
                      • {apt.reason || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                      <PrescriptionMedicineNameSearch
                        medicineRowId={med.id}
                        name={med.name}
                        expanded={med.expanded}
                        onNameChange={(value) =>
                          updateMedicine(med.id, { name: value })
                        }
                        onSelectCatalogRow={(row) =>
                          updateMedicine(med.id, updatesFromCatalogRow(row))
                        }
                      />

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
          <div className={`${modalFooterRowClassName} pt-2 border-t border-[#dedee1]`}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
              className={modalFooterCancelClassName}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              loading={submitting}
              leadingIcon={<CircleCheck className="h-4 w-4" />}
              className={`${modalFooterPrimaryClassName} disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isEditMode ? "Update Prescription" : "Send Prescription"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
