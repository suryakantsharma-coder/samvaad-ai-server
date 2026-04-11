import { useState, useEffect } from "react";
import {
  CalendarIcon,
  UserIcon,
  CheckCircle2,
  AlertTriangle,
  CircleCheck,
  X,
  Search,
  Trash2Icon,
} from "lucide-react";
import { formatDateTime12h, formatHmClock12h } from "../../lib/dateTimeDisplay";
import { showWarning } from "../../lib/toast";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useDoctor } from "../../contexts/DoctorProvider";
import { Doctor } from "../../types/doctor.type";
// --- Components ---
import { useAppointments } from "../../contexts/AppointmentProvider";
import {
  AppointmentPayload,
  RescheduleAppointmentPayload,
} from "../../types/appointment.type";
import { Patients } from "../../types/patient.type";
import { usePatient } from "../../contexts/PatientProvider";
import { useNavigate } from "react-router-dom";
import {
  modalFooterCancelClassName,
  modalFooterDangerClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
} from "./modalFooterStyles";

const ModalHeader = ({
  title,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  icon: any;
  variant?: "default" | "danger";
}) => (
  <DialogHeader
    className={`flex flex-row items-center gap-2 p-4 border-b rounded-t-lg bg-[#F6F6F6]  ${variant === "danger" ? "bg-[#FFF1F1]" : "bg-[#F6F6F6]"}`}
  >
    <div className="flex items-center gap-2 p-[2px] rounded-[50px] bg-white">
      <Icon className={`w-4 h-4 text-black`} />
    </div>
    <DialogTitle className="text-sm font-semibold text-gray-700">
      {title}
    </DialogTitle>
  </DialogHeader>
);

const WhatsAppCheckbox = ({ label }: { label: string }) => (
  <div className="flex items-center space-x-2 mt-[20px]">
    <input
      type="checkbox"
      id="whatsapp"
      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
    />
    <label htmlFor="whatsapp" className="text-[12px] text-gray-500">
      {label}
    </label>
  </div>
);

/** Local calendar date (YYYY-MM-DD) + HH:mm → ISO string for API */
function combineAppointmentDateTime(dateStr: string, timeHHmm: string): string {
  if (!dateStr?.trim() || !timeHHmm?.trim()) return "";
  const [y, mo, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const [hh, mm] = timeHHmm.split(":").map((x) => parseInt(x, 10));
  if ([y, mo, d, hh, mm].some((n) => Number.isNaN(n))) return "";
  return new Date(y, mo - 1, d, hh, mm ?? 0, 0, 0).toISOString();
}

const APPOINTMENT_TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 17 && minute > 0) break;
      const d = new Date(2000, 0, 1, hour, minute);
      const label = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push({ value, label });
    }
  }
  return slots;
})();

function normalizePatientGender(g: string | undefined): string {
  const key = (g ?? "").trim().toLowerCase();
  if (key === "female") return "Female";
  if (key === "other") return "Other";
  return "Male";
}

// 1. New Appointment Modal
export const NewAppointmentModal = ({
  open,
  onOpenChange,
  onClose,
  onSave,
}: any) => {
  const { handleCreateAppointment } = useAppointments();
  const [formData, setFormData] = useState({
    age: 0,
    gender: "Male",
    phone: "",
    patient: "",
    reason: "",
    appointmentDateTime: "",
    timeSlot: "",
    type: "hospital",
  });
  const { searchDoctorsByName, searchedDoctors, resetSearchedDoctors } =
    useDoctor();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDoctorQuery, setSearchDoctorQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const { handleSearchPatients, searchedPatients, resetSearchedPatients } =
    usePatient();
  const [selectedPatient, setSelectedPatient] = useState<Patients | null>(null);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAppointment = async () => {
    if (isSaving) return;
    const appointmentIso = combineAppointmentDateTime(
      formData.appointmentDateTime,
      formData.timeSlot,
    );
    if (
      !selectedDoctor?._id ||
      !selectedPatient?._id ||
      !formData.reason?.trim() ||
      !formData.appointmentDateTime ||
      !formData.timeSlot ||
      !formData.type ||
      !appointmentIso
    ) {
      showWarning("Warning", "Please fill all the fields.");
      return;
    }
    const payload: AppointmentPayload = {
      patient: selectedPatient._id,
      doctor: selectedDoctor._id,
      status: "Upcoming",
      type: formData.type,
      reason: formData.reason.trim(),
      appointmentDateTime: appointmentIso,
    };
    setIsSaving(true);
    try {
      await handleCreateAppointment(payload);
      onSave({
        patientName: selectedPatient?.fullName || "",
        doctorName: selectedDoctor?.fullName || "",
        appointmentDate: formData.appointmentDateTime,
        appointmentTime: formData.timeSlot,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDoctorQuery.length !== 0) {
        searchDoctorsByName(searchDoctorQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchDoctorQuery]);

  useEffect(() => {
    if (searchQuery.length !== 0) {
      handleSearchPatients(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPatient !== null) {
      setFormData((prev) => ({
        ...prev,
        patient: selectedPatient._id,
        age: selectedPatient.age,
        gender: normalizePatientGender(selectedPatient.gender),
        phone: selectedPatient.phoneNumber,
        reason: selectedPatient.reason,
      }));
    }
  }, [selectedPatient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none">
        <ModalHeader title="New Appointment" icon={CalendarIcon} />
        <div className="px-[25px] pb-[25px] space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              Patient Name <span className="text-red-500">*</span>
            </label>
            {/* make it searchable as doctor search input */}
            {!selectedPatient && (
              <div className="relative">
                <Input
                  placeholder="Type or Search for patient"
                  className="h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  required
                />
              </div>
            )}

            {/* if list is empty show a add patient button */}
            {searchedPatients &&
              searchedPatients.length === 0 &&
              searchQuery && (
                <div className="space-y-1.5">
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate("/patients");
                    }}
                  >
                    Add Patient
                  </Button>
                </div>
              )}

            {searchedPatients && searchedPatients.length > 0 && (
              <div className="space-y-1.5 bg-[#F5F5F5] max-h-[200px] overflow-y-auto">
                {searchedPatients.map((patient: Patients) => (
                  <div
                    className="cursor-pointer hover:bg-gray-100  p-2 rounded-md"
                    key={patient?._id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      resetSearchedPatients();
                      setSearchQuery("");
                    }}
                  >
                    {patient?.fullName}
                  </div>
                ))}
              </div>
            )}

            {selectedPatient && (
              <div className="space-y-1.5">
                <div className="space-y-1.5 flex justify-between px-[10px] items-center gap-2 bg-[#F5F5F5] rounded-md">
                  <p className="text-sm font-medium  p-2 rounded-md">
                    {selectedPatient?.fullName} (patient id:{" "}
                    {selectedPatient?._id})
                  </p>
                  <Trash2Icon
                    className="w-4 h-4 text-red-500 cursor-pointer"
                    onClick={() => {
                      setSelectedPatient(null);
                      resetSearchedPatients();
                      setSearchQuery("");
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Age <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                className="h-9"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Gender <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
                required
              >
                <SelectTrigger className="h-9">
                  <div className="flex w-full min-w-0 items-center gap-2">
                    <UserIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    <SelectValue placeholder="Select gender" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select defaultValue="+91">
                  <SelectTrigger className="w-20 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="669 334 3366"
                  className="h-9"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Reason <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Type name"
                className="h-9"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
                minLength={3}
              />
            </div>
          </div>

          {/* list all doctors */}
          <div className="space-y-1.5">
            {/* search docotors list with search input and list all doctors */}
            {!selectedDoctor && (
              <div className="relative">
                <Input
                  placeholder="Search doctor"
                  className="h-9"
                  value={searchDoctorQuery}
                  onChange={(e) => {
                    if (e.target.value.length !== 0) {
                      setSearchDoctorQuery(e.target.value);
                    } else {
                      resetSearchedDoctors();
                      setSearchDoctorQuery("");
                    }
                  }}
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            )}
            {searchedDoctors && searchedDoctors.length > 0 && (
              <div className="space-y-1.5 bg-[#F5F5F5] max-h-[200px] overflow-y-auto">
                {searchedDoctors.map((doctor: Doctor) => (
                  <div
                    className="cursor-pointer hover:bg-gray-100  p-2 rounded-md"
                    key={doctor?._id}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      resetSearchedDoctors();
                      setSearchDoctorQuery("");
                    }}
                  >
                    {doctor?.fullName}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* once selected the doctor, show the doctor details like name, phone, email, designation, availability, status, utilization, profileImage */}
          {selectedDoctor && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Doctor <span className="text-red-500">*</span>
                </label>

                <div className="space-y-1.5 flex justify-between px-[10px] items-center gap-2 bg-[#F5F5F5] rounded-md">
                  <p className="text-sm font-medium  p-2 rounded-md">
                    {selectedDoctor?.fullName} (doctor id: {selectedDoctor?._id}
                    )
                  </p>
                  <Trash2Icon
                    className="w-4 h-4 text-red-500 cursor-pointer"
                    onClick={() => {
                      setSelectedDoctor(null);
                      resetSearchedDoctors();
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center justify-center">
                <Input
                  type="date"
                  className="w-full h-9"
                  value={formData.appointmentDateTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appointmentDateTime: e.target.value,
                    })
                  }
                  required
                />
                {/* <CalendarIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" /> */}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Time Slot <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.timeSlot || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, timeSlot: value })
                }
                required
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TIME_SLOTS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
              required
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkup">Checkup</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={modalFooterRowClassName}>
            <Button
              variant="ghost"
              className={modalFooterCancelClassName}
              onClick={onClose}
              disabled={isSaving}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              className={modalFooterPrimaryClassName}
              onClick={() => void handleSaveAppointment()}
              loading={isSaving}
              leadingIcon={<CircleCheck className="h-4 w-4" />}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 2. Reschedule Modal
export const RescheduleModal = ({
  open,
  onOpenChange,
  onReschedule,
  onClose,
  data,
}: any) => {
  console.log(data);
  const [onEdit, setOnEdit] = useState(false);
  const { handleUpdateAppointment } = useAppointments();
  const [formData, setFormData] = useState({
    appointmentDateTime: "",
    timeSlot: "",
  });
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const handleRescheduleClick = async () => {
    if (rescheduleSubmitting) return;
    if (formData.appointmentDateTime !== data?.appointmentDateTime) {
      const payload: RescheduleAppointmentPayload = {
        appointmentDateTime: new Date(
          formData.appointmentDateTime,
        ).toISOString(),
      };
      setRescheduleSubmitting(true);
      try {
        await handleUpdateAppointment(data?._id || "", payload);
        onReschedule();
      } finally {
        setRescheduleSubmitting(false);
      }
    } else {
      showWarning("Warning", "No changes made.");
    }
    setOnEdit(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none">
        <ModalHeader title="Reschedule Appointment" icon={CalendarIcon} />
        <div className="px-[25px] pb-[25px] space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={data?.patient?.fullName || ""}
              disabled
              className="h-9 bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                New Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {!onEdit ? (
                  <Input
                    value={new Date(
                      data?.appointmentDateTime,
                    ).toLocaleDateString()}
                    readOnly
                    className="h-9 pr-10"
                    onClick={() => setOnEdit(true)}
                  />
                ) : (
                  <>
                    <Input
                      value={formData.appointmentDateTime}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          appointmentDateTime: e.target.value,
                        });
                      }}
                      type="date"
                      className="h-9 pr-10"
                      required
                    />
                  </>
                )}

                {!onEdit && (
                  <CalendarIcon className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                New Time Slot <span className="text-red-500">*</span>
              </label>
              <Select value={data?.timeSlot}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9am">{data?.timeSlot}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <WhatsAppCheckbox label="Automatically send reschedule details to the patient's WhatsApp" />
          <div className={modalFooterRowClassName}>
            <Button
              variant="ghost"
              className={modalFooterCancelClassName}
              onClick={onClose}
              disabled={rescheduleSubmitting}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              className={modalFooterPrimaryClassName}
              onClick={() => void handleRescheduleClick()}
              loading={rescheduleSubmitting}
              leadingIcon={<CircleCheck className="h-4 w-4" />}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 3. Mark as Done Modal
export const MarkAsDoneModal = ({
  open,
  onOpenChange,
  onDone,
  onClose,
  data,
}: any) => {
  const { handleMarkAsDoneAppointment } = useAppointments();
  const [markDoneSubmitting, setMarkDoneSubmitting] = useState(false);
  const handleConfirmDone = async () => {
    const id = data?._id;
    if (!id || markDoneSubmitting) return;
    setMarkDoneSubmitting(true);
    try {
      await handleMarkAsDoneAppointment(id);
      onDone();
    } finally {
      setMarkDoneSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-none">
        <ModalHeader title="Mark Appointment as Done" icon={CheckCircle2} />
        <div className="px-[25px] pb-[25px]">
          <p className="text-[14px] leading-relaxed text-gray-600">
            You're marking{" "}
            <strong className="text-black">{data?.patient.fullName}'s</strong>{" "}
            appointment with{" "}
            <strong className="text-black">{data?.doctor.fullName}</strong>{" "}
            scheduled on{" "}
            <strong className="text-black">
              {data?.appointmentDateTime
                ? formatDateTime12h(data.appointmentDateTime)
                : "—"}
            </strong>{" "}
            as completed. Please confirm to proceed.
          </p>
          <WhatsAppCheckbox label="Automatically send completion message to the patient's WhatsApp" />
          <div className={modalFooterRowClassName}>
            <Button
              variant="ghost"
              className={modalFooterCancelClassName}
              onClick={onClose}
              disabled={markDoneSubmitting}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Close
            </Button>
            <Button
              className={modalFooterPrimaryClassName}
              onClick={() => void handleConfirmDone()}
              loading={markDoneSubmitting}
              leadingIcon={<CircleCheck className="h-4 w-4" />}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 4. Cancel Modal
export const CancelAppointmentModal = ({
  open,
  onOpenChange,
  onCancel,
  onClose,
  data,
}: any) => {
  const { handleDeleteAppointment } = useAppointments();
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const handleCancel = async () => {
    const id = data?._id;
    if (!id || cancelSubmitting) return;
    setCancelSubmitting(true);
    try {
      await handleDeleteAppointment(id);
      onCancel();
      onOpenChange(false);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none overflow-hidden">
        <ModalHeader
          title="Cancel Appointment"
          icon={AlertTriangle}
          variant="danger"
        />
        <div className="px-[25px] pb-[25px] space-y-4">
          <p className="text-[14px] leading-relaxed text-gray-600">
            Appointment for{" "}
            <strong className="text-black">{data?.patientName}</strong> with{" "}
            <strong className="text-black">{data?.doctorName}</strong> scheduled
            on{" "}
            <strong className="text-black">
              {data?.appointmentDateTime
                ? formatDateTime12h(data.appointmentDateTime)
                : `${data?.appointmentDate ?? "—"} at ${formatHmClock12h(data?.appointmentTime) || data?.appointmentTime || "—"}`}
            </strong>{" "}
            will be canceled. Please confirm to proceed.
          </p>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-gray-700">
              Reason (Optional)
            </label>
            <Input placeholder="Type your reason to cancel" className="h-9" />
          </div>
          <WhatsAppCheckbox label="Automatically send cancelation message to the patient's WhatsApp" />
          <div className={modalFooterRowClassName}>
            <Button
              variant="ghost"
              className={modalFooterCancelClassName}
              onClick={onClose}
              disabled={cancelSubmitting}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Close
            </Button>
            <Button
              className={modalFooterDangerClassName}
              onClick={() => void handleCancel()}
              loading={cancelSubmitting}
              leadingIcon={<Trash2Icon className="h-4 w-4" />}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
