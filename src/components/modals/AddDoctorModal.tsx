import { BriefcaseIcon, CircleCheck, MailIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { Doctor, DoctorHoliday } from "../../types/doctor.type";
import { parseAveragePatientTime } from "../../data/doctor";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
  modalHeaderCloseButtonClassName,
} from "./modalFooterStyles";

function RequiredMark(): JSX.Element {
  return (
    <span className="text-[#ff0004] ml-0.5" aria-hidden>
      *
    </span>
  );
}

export interface DoctorData {
  name: string;
  phone: string;
  email: string;
  countryCode: string;
  workingDays: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
  designation: string;
  /** Average appointment length in minutes. */
  averagePatientTime: number;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  status: "Off Duty" | "On Duty";
  holidays?: DoctorHoliday[];
}

const DEFAULT_FORM: DoctorData = {
  name: "",
  phone: "",
  email: "",
  countryCode: "+91",
  workingDays: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: false,
  },
  designation: "",
  averagePatientTime: 10,
  morningStart: "10:00 AM",
  morningEnd: "1:00 PM",
  eveningStart: "2:00 PM",
  eveningEnd: "6:00 PM",
  status: "On Duty",
};

function parsePhoneForForm(phoneNumber: string): {
  countryCode: string;
  phone: string;
} {
  const p = phoneNumber.trim();
  const m = p.match(/^(\+\d{1,4})\s+(.*)$/);
  if (m) return { countryCode: m[1], phone: m[2].trim() };
  return { countryCode: "+91", phone: p };
}

function parseAvailabilityForForm(av: string): {
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
} {
  const raw = av.trim();
  const chunks = raw.includes("&#x2F;n")
    ? raw.split("&#x2F;n").map((s) => s.trim())
    : raw.split("/n").map((s) => s.trim());
  let morningStart = "10:00 AM",
    morningEnd = "1:00 PM",
    eveningStart = "2:00 PM",
    eveningEnd = "6:00 PM";
  if (chunks[0]) {
    const hm = chunks[0].match(/^(.+?)\s*-\s*(.+)$/);
    if (hm) {
      morningStart = hm[1].trim();
      morningEnd = hm[2].trim();
    }
  }
  if (chunks[1]) {
    const hm = chunks[1].match(/^(.+?)\s*-\s*(.+)$/);
    if (hm) {
      eveningStart = hm[1].trim();
      eveningEnd = hm[2].trim();
    }
  }
  return { morningStart, morningEnd, eveningStart, eveningEnd };
}

function doctorToFormData(d: Doctor): DoctorData {
  const { countryCode, phone } = parsePhoneForForm(d.phoneNumber);
  const times = parseAvailabilityForForm(d.availability);
  const st = d.status as DoctorData["status"];
  const status = ["Off Duty", "On Duty"].includes(st) ? st : "On Duty";
  const fetchedAveragePatientTime = parseAveragePatientTime(d.averagePatientTime);
  return {
    name: d.fullName,
    phone,
    email: d.email,
    countryCode,
    workingDays: { ...DEFAULT_FORM.workingDays },
    designation: d.designation,
    averagePatientTime: fetchedAveragePatientTime ?? DEFAULT_FORM.averagePatientTime,
    ...times,
    status,
    holidays: Array.isArray(d.holidays) ? d.holidays : undefined,
  };
}

interface AddDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (doctor: DoctorData) => void | Promise<void>;
  initialDoctor?: Doctor | null;
  onUpdate?: (doctorId: string, doctor: DoctorData) => Promise<void>;
}

export const AddDoctorModal = ({
  open,
  onOpenChange,
  onSave,
  initialDoctor = null,
  onUpdate,
}: AddDoctorModalProps): JSX.Element => {
  const [formData, setFormData] = useState<DoctorData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialDoctor) {
      setFormData(doctorToFormData(initialDoctor));
    } else {
      setFormData({ ...DEFAULT_FORM });
    }
  }, [open, initialDoctor?._id, initialDoctor?.averagePatientTime]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (initialDoctor && onUpdate) {
      setSubmitting(true);
      try {
        await onUpdate(initialDoctor._id, formData);
        setFormData({ ...DEFAULT_FORM });
        onOpenChange(false);
      } catch {
        /* toast from provider */
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitting(true);
    try {
      await Promise.resolve(onSave(formData));
      setFormData({ ...DEFAULT_FORM });
      onOpenChange(false);
    } catch {
      /* toast from provider */
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({ ...DEFAULT_FORM });
  };

  const toggleWorkingDay = (day: keyof typeof formData.workingDays) => {
    setFormData({
      ...formData,
      workingDays: {
        ...formData.workingDays,
        [day]: !formData.workingDays[day],
      },
    });
  };

  // add close icon liek patient modal
  const handleCloseIcon = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[746px] w-[90vw] p-0 gap-0 rounded-[10px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-[10px] px-5 py-4 bg-grey-light sticky top-0 z-10">
          <BriefcaseIcon className="w-6 h-6 bg-white rounded-[50px] p-[4px]" />
          <DialogTitle className="font-title-3m text-[18px] leading-[23px] font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
            {initialDoctor ? "Edit doctor" : "Add Doctors"}
          </DialogTitle>
          <button
            type="button"
            className={`absolute right-3 top-3 z-10 ${modalHeaderCloseButtonClassName}`}
            onClick={handleCloseIcon}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Doctor Name
              <RequiredMark />
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Type name"
              className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Doctor Designation
              <RequiredMark />
            </label>
            <Input
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
              placeholder="Cardiologist"
              className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Average Patient Time (minutes)
              <RequiredMark />
            </label>
            <Input
              type="number"
              min={1}
              value={formData.averagePatientTime}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                setFormData({
                  ...formData,
                  averagePatientTime: Number.isFinite(parsed) ? parsed : 10,
                });
              }}
              placeholder="10"
              className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Phone
                <RequiredMark />
              </label>
              <div className="flex gap-2.5">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, countryCode: value })
                  }
                >
                  <SelectTrigger className="w-[100px] h-[44px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="569 334 3366"
                  className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Email Address
                <RequiredMark />
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@hospital.com"
                  className="h-[44px] px-4 py-2 pr-12 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
                <MailIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-x-70" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Working Days
              <RequiredMark />
            </label>
            <div className="flex flex-wrap justify-between">
              {[
                { key: "mon", label: "Mon" },
                { key: "tue", label: "Tue" },
                { key: "wed", label: "Wed" },
                { key: "thu", label: "Thu" },
                { key: "fri", label: "Fri" },
                { key: "sat", label: "Sat" },
                { key: "sun", label: "Sun" },
              ].map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() =>
                    toggleWorkingDay(
                      day.key as keyof typeof formData.workingDays,
                    )
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border transition-colors ${
                    formData.workingDays[
                      day.key as keyof typeof formData.workingDays
                    ]
                      ? "bg-primary-2 border-primary-2 text-white"
                      : "bg-white border-[#dedee1] text-black"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                      formData.workingDays[
                        day.key as keyof typeof formData.workingDays
                      ]
                        ? "bg-white border-white"
                        : "bg-white border-[#dedee1]"
                    }`}
                  >
                    {formData.workingDays[
                      day.key as keyof typeof formData.workingDays
                    ] && (
                      <svg
                        className="w-4 h-4 text-primary-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                    {day.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Availability (Morning)
                <RequiredMark />
              </label>
              <div className="flex items-center gap-2.5">
                <Input
                  type="text"
                  value={formData.morningStart}
                  onChange={(e) =>
                    setFormData({ ...formData, morningStart: e.target.value })
                  }
                  placeholder="10:00 AM"
                  className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
                <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)]">
                  To
                </span>
                <Input
                  type="text"
                  value={formData.morningEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, morningEnd: e.target.value })
                  }
                  placeholder="1:00 PM"
                  className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Availability (Evening)
                <RequiredMark />
              </label>
              <div className="flex items-center gap-2.5">
                <Input
                  type="text"
                  value={formData.eveningStart}
                  onChange={(e) =>
                    setFormData({ ...formData, eveningStart: e.target.value })
                  }
                  placeholder="2:00 AM"
                  className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
                <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)]">
                  To
                </span>
                <Input
                  type="text"
                  value={formData.eveningEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, eveningEnd: e.target.value })
                  }
                  placeholder="6:00 PM"
                  className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
              </div>
            </div>
          </div>

          {/* status select */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Status
              <RequiredMark />
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "Off Duty" | "On Duty",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Off Duty">Off Duty</SelectItem>
                <SelectItem value="On Duty">On Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`${modalFooterRowClassName} mt-4`}>
            <Button
              onClick={handleCancel}
              variant="ghost"
              disabled={submitting}
              className={modalFooterCancelClassName}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              loading={submitting}
              leadingIcon={<CircleCheck className="h-4 w-4" />}
              className={modalFooterPrimaryClassName}
            >
              {initialDoctor ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
