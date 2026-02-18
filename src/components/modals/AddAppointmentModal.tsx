import { useState, useEffect } from "react";
import {
  CalendarIcon,
  UserIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  CheckCircle,
  Search,
  Trash2Icon,
} from "lucide-react";

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
    type: "Hospital",
  });
  const { searchDoctorsByName, searchedDoctors, resetSearchedDoctors } =
    useDoctor();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDoctorQuery, setSearchDoctorQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const {
    handleSearchPatients,
    searchedPatients,
    resetSearchedPatients,
  } = usePatient();
  const [selectedPatient, setSelectedPatient] = useState<Patients | null>(null);
  const navigate = useNavigate();

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
      setFormData({
        ...formData,
        patient: selectedPatient._id,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        phone: selectedPatient.phoneNumber,
        reason: selectedPatient.reason,
      });
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
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />{" "}
                    <SelectValue placeholder="Male" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
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
                value={formData.timeSlot}
                onValueChange={(value) =>
                  setFormData({ ...formData, timeSlot: value })
                }
                required
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9am">09:00 AM</SelectItem>
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

          <div className="flex justify-end gap-3 pt-4 ">
            <Button
              variant="ghost"
              className="text-gray-500 bg-[#F5F5F5] text-xs h-9 px-4"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-[2px]" /> Cancel
            </Button>
            <Button
              className="bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs h-9 px-4"
              onClick={async () => {
                if (
                  (formData.type,
                  formData.reason,
                  formData.appointmentDateTime,
                  !selectedDoctor?._id || !selectedPatient?._id)
                ) {
                  alert("Please fill all the fields");
                  return;
                } else {
                  const payload: AppointmentPayload = {
                    patient: selectedPatient?._id || "",
                    doctor: selectedDoctor?._id || "",
                    status: "Upcoming",
                    type: formData.type,
                    reason: formData.reason,
                    appointmentDateTime: formData.appointmentDateTime,
                  };

                  await handleCreateAppointment(payload);
                  alert("Appointment created successfully");
                  onSave({
                    patientName: selectedPatient?.fullName || "",
                    doctorName: selectedDoctor?.fullName || "",
                    appointmentDate: formData.appointmentDateTime,
                    appointmentTime: formData.timeSlot,
                  });
                }
              }}
            >
              <Save className="w-4 h-4 mr-[2px]" /> Save
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
  const handleReschedule = () => {
    if (formData.appointmentDateTime !== data?.appointmentDateTime) {
      const payload: RescheduleAppointmentPayload = {
        appointmentDateTime: new Date(
          formData.appointmentDateTime,
        ).toISOString(),
      };
      handleUpdateAppointment(data?._id || "", payload);
      alert("Appointment rescheduled successfully");
      onReschedule();
    } else {
      alert("No changes made");
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
          <div className="flex justify-end gap-[20px] pt-4">
            <Button
              variant="ghost"
              className=" text-gray-500 text-xs h-9 px-4 bg-[#F5F5F5] text-[14px]"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-[2px]" /> Cancel
            </Button>
            <Button
              className="bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs h-9 px-4 text-[14px]"
              onClick={() => {
                // validate the new date and time slot
                handleReschedule();
              }}
            >
              <CheckCircle className="w-4 h-4 mr-[2px]" /> Save
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
              {new Date(data?.appointmentDateTime).toLocaleDateString()}
            </strong>{" "}
            as completed. Please confirm to proceed.
          </p>
          <WhatsAppCheckbox label="Automatically send completion message to the patient's WhatsApp" />
          <div className="flex justify-end gap-3 pt-6">
            <Button
              variant="ghost"
              className="w-[86px] text-gray-500 text-xs h-9 px-6 bg-[#F5F5F5] text-[14px]"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-1" /> Close
            </Button>
            <Button
              className="w-[86px] bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-[14px] h-9 px-6"
              onClick={() => {
                handleMarkAsDoneAppointment(data?._id || "");
                onDone();
              }}
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Done
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

  const handleCancel = () => {
    onCancel();
    handleDeleteAppointment(data?._id || "");
    onOpenChange(false);
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
              {data?.appointmentDate} at {data?.appointmentTime}
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
          <div className="flex justify-end gap-[20px] pt-4">
            <Button
              variant="ghost"
              className="w-[86px] text-gray-500 text-xs h-9 px-6 bg-[#F5F5F5] text-[14px]"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-1" /> Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-6 text-[14px]"
              onClick={() => {
                handleCancel();
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
