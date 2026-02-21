import {
  ArrowLeft,
  Building2,
  Calendar,
  Eye,
  FileText,
  RefreshCw,
  User,
  Video,
  PhoneCallIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { getPatientHistory } from "../../data/history";
import type {
  Appointments,
  Prescription,
  Medicine,
} from "../../types/appointment.type";
import type { PatientHistoryResponse } from "../../types/appointment.type";
import type { Patients } from "../../types/patient.type";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { NewPrescriptionModal } from "../../components/modals";
import type { NewPrescriptionPayload } from "../../components/modals/NewPrescriptionModal";
import { useNavigate, useParams, useLocation } from "react-router-dom";

function formatAppointmentDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAppointmentTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPrescriptionDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function medicineLine(med: Medicine): string {
  const dose = med.dosage ? `${med.dosage.value} ${med.dosage.unit}` : "";
  const dur = med.duration ? `${med.duration.value} ${med.duration.unit}` : "";
  const parts: string[] = [];
  if (med.intake) parts.push(med.intake);
  if (med.time) {
    const t: string[] = [];
    if (med.time.breakfast) t.push("Breakfast");
    if (med.time.lunch) t.push("Lunch");
    if (med.time.dinner) t.push("Dinner");
    if (t.length) parts.push(t.join("-"));
  }
  return (
    [dose, dur].filter(Boolean).join(" • ") +
    (parts.length ? ` • ${parts.join(": ")}` : "")
  );
}

export const PatientRecord = (): JSX.Element => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const patientFromState = location.state?.patient as Patients | undefined;

  const [patient, setPatient] = useState<Patients | null>(
    patientFromState ?? null,
  );
  const [appointments, setAppointments] = useState<Appointments[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [showNewPrescriptionModal, setShowNewPrescriptionModal] =
    useState(false);

  const fetchData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = (await getPatientHistory(
        patientId,
      )) as PatientHistoryResponse;
      const data = res?.data;
      if (data) {
        const {
          patient: overviewPatient,
          appointments: aptList,
          prescriptions: rxList,
        } = data;
        const aptArray = Array.isArray(aptList) ? aptList : [];
        const rxArray = Array.isArray(rxList) ? rxList : [];
        setAppointments(aptArray);
        setPrescriptions(rxArray);
        if (!patientFromState) {
          if (overviewPatient) {
            setPatient(overviewPatient as unknown as Patients);
          } else if (rxArray.length) {
            const first = rxArray[0];
            setPatient({
              _id: first.patient,
              fullName: first.patientName ?? "",
              phoneNumber: "",
              age: 0,
              gender: "Other",
              createdAt: "",
              updatedAt: "",
              reason: "",
              __v: 0,
            } as Patients);
          }
        }
      }
    } catch {
      setPatient(patientFromState ?? null);
      setAppointments([]);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, patientFromState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewPrescription = (aptId: string) => {
    setSelectedAppointmentId(aptId);
    document
      .getElementById("prescription-detail-column")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSavePrescription = async (_payload: NewPrescriptionPayload) => {
    setShowNewPrescriptionModal(false);
  };

  const selectedPrescription = selectedAppointmentId
    ? prescriptions.find((p) => {
        const aptId =
          typeof p.appointment === "string"
            ? p.appointment
            : p.appointment?._id;
        return aptId === selectedAppointmentId;
      })
    : null;

  const sortedByDate = [...appointments].sort(
    (a, b) =>
      new Date(b.appointmentDateTime).getTime() -
      new Date(a.appointmentDateTime).getTime(),
  );
  const lastVisitDate = sortedByDate[0]?.appointmentDateTime
    ? formatAppointmentDate(sortedByDate[0].appointmentDateTime)
    : "—";

  if (loading && !patient) {
    return (
      <div className="bg-app-background min-h-screen flex flex-col">
        <PatientSearchSection />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="font-title-4r text-x-70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!patientId || (!patient && !patientFromState)) {
    return (
      <div className="bg-app-background min-h-screen flex flex-col">
        <PatientSearchSection />
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="font-title-4r text-x-70">Patient not found.</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate("/prescriptions")}
          >
            Back to Prescriptions
          </Button>
        </div>
      </div>
    );
  }

  const p = patient ?? patientFromState!;

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col">
      <PatientSearchSection />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-[24px]">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-4 flex-1">
          {/* Left column: Patient info + Appointment history */}
          <div className="flex flex-col gap-0 bg-white rounded-[10px] border border-[#dedee1]">
            {/* Patient header */}
            <div className="flex justify-between gap-3 border-b border-[#dedee1]  p-4">
              <div className="flex flex-col gap-0">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="drounded-full shrink-0"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5 text-black" />
                  </Button>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-grey-light border border-[#dedee1] shrink-0">
                      <User className="h-5 w-5 text-x-70" />
                    </div>
                    <div className="flex flex-col gap-0">
                      <div className="h-[26px] items-center justify-start">
                        <h1 className=" font-title-3m text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] truncate">
                          {p.fullName}
                        </h1>
                        <p className="font-title-5l text-[#57575f] text-[length:var(--title-5l-font-size)]">
                          {p.age} years old • {p.gender} • {p.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 pl-12">
                <div className="flex flex-col gap-1">
                  <div className="h-[26px] flex items-center justify-start gap-[5px]">
                    <Calendar className="h-4 w-4 text-[#57575f]" aria-hidden />
                    <span className="font-title-5l text-[#57575f] text-sm">
                      Last Visit
                    </span>
                  </div>
                  <span className="font-title-4r text-[#333333] text-sm pl-5">
                    {lastVisitDate}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-[26px] flex items-center justify-start gap-[5px]">
                    <Calendar className="h-4 w-4 text-[#57575f]" aria-hidden />
                    <span className="font-title-5l text-[#57575f] text-sm">
                      Total Visit
                    </span>
                  </div>
                  <span className="font-title-4r text-[#333333] text-sm pl-5">
                    {appointments.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Appointment history */}
            <div className="flex flex-col gap-4 p-4">
              <h2 className="font-title-3m text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)]">
                Appointment History
              </h2>
              <div className="relative flex flex-col gap-0">
                {/* Timeline line */}
                <div
                  className="absolute left-[11px] top-[48px] bottom-12 w-px bg-[#dedee1]"
                  aria-hidden
                />
                {appointments.map((apt) => {
                  const isSelected = selectedAppointmentId === apt._id;
                  return (
                    <div
                      key={apt._id}
                      className="relative flex gap-4 pl-10 pb-4 last:pb-0"
                    >
                      <div
                        className={`absolute left-[3px] w-[16px] h-[16px] rounded-full border-2 border-white shrink-0 ${"bg-primary-2"}`}
                        style={{ top: 48 }}
                      />
                      <div className="flex-1 min-w-0 rounded-[10px] border border-[#dedee1] bg-white p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center gap-2">
                          <p className="font-title-4m text-[#333333]">
                            {formatAppointmentDate(apt.appointmentDateTime)} |{" "}
                            {formatAppointmentTime(apt.appointmentDateTime)}
                          </p>
                          <span className="inline-flex items-center gap-[5px] px-[10px] py-[6px] rounded-full bg-[#DFFFF3] text-[#00955C] font-title-4r text-xs">
                            {apt.type === "Hospital" ? (
                              <Building2 className="h-3.5 w-3.5" />
                            ) : (
                              <PhoneCallIcon className="h-3.5 w-3.5" />
                            )}
                            {apt.type || "Hospital"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <p className=" w-[75%] font-title-5l text-[#57575f] text-sm bg-[#F6F6F6] p-2 rounded-[2px]">
                            Reason: {apt.reason || "—"}
                          </p>
                          <div className="w-[28%] flex items-center justify-end gap-2">
                            {/* <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-2 text-white font-title-4r text-xs">
                              {apt.type === "Hospital" ? (
                                <Building2 className="h-3.5 w-3.5" />
                              ) : (
                                <Video className="h-3.5 w-3.5" />
                              )}
                              {apt.type || "Hospital"}
                            </span> */}
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 h-8 rounded-[6px] text-[14px] text-[#333333] hover:text-primary-2 hover:bg-primary-2/10 cursor-pointer transition-colors focus:outline-none"
                              onClick={() => handleViewPrescription(apt._id)}
                            >
                              <Eye className="h-4 w-4" />
                              View Prescription
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {appointments.length === 0 && (
                  <p className="font-title-5l text-x-70 text-sm pl-10">
                    No appointments yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Prescription detail */}
          <div id="prescription-detail-column" className="flex flex-col gap-6">
            <div className="rounded-[10px] border border-[#dedee1] bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4  border-[#dedee1]">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-x-70" />
                  <h2 className="font-title-3m text-black text-[length:var(--title-3m-font-size)]">
                    Prescription
                    <span className="font-title-5l text-[#57575f] text-sm">
                      {selectedPrescription?.medicines?.length != null
                        ? ` (${selectedPrescription.medicines.length} Medicines)`
                        : ""}
                    </span>
                  </h2>
                </div>
                {selectedPrescription?.appointmentDate && (
                  <span className="font-title-5l text-[#57575f] text-sm">
                    {formatPrescriptionDate(
                      selectedPrescription.appointmentDate,
                    )}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col gap-4">
                {selectedPrescription?.medicines?.length ? (
                  selectedPrescription.medicines.map((med, i) => (
                    <div
                      key={i}
                      className="rounded-[10px] border border-[#dedee1] bg-white p-4 flex flex-col gap-2"
                    >
                      <p className="font-title-4m text-black">{med.name}</p>
                      <p className="font-title-5l text-[#57575f] text-sm">
                        {medicineLine(med)}
                      </p>
                      {med.notes && (
                        <p className="font-title-5l text-[#57575f] text-sm">
                          Note: {med.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : selectedAppointmentId ? (
                  <p className="font-title-5l text-[#57575f] text-sm py-4">
                    No prescription for this visit.
                  </p>
                ) : (
                  <p className="font-title-5l text-[#57575f] text-sm py-4">
                    No prescription selected. Click “View Prescription” on an
                    appointment to see details.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#dedee1]">
          <Button
            variant="ghost"
            className="inline-flex items-center gap-2 px-4 py-2 h-11 rounded-[6px] bg-white border border-[#dedee1] text-x-70 font-title-4r hover:bg-grey-light"
            onClick={() => setShowNewPrescriptionModal(true)}
          >
            <RefreshCw className="h-5 w-5" />
            Reuse Last Prescription
          </Button>
          <Button
            className="inline-flex items-center gap-2 px-4 py-2 h-11 rounded-[6px] bg-primary-2 hover:bg-primary-2/90 text-white font-title-4r"
            onClick={() => setShowNewPrescriptionModal(true)}
          >
            <FileText className="h-5 w-5" />
            New Prescription
          </Button>
        </div>
      </main>

      <NewPrescriptionModal
        open={showNewPrescriptionModal}
        onOpenChange={setShowNewPrescriptionModal}
        onSave={handleSavePrescription}
        initialPrescription={null}
        initialPatient={p}
      />
    </div>
  );
};
