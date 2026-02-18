import { BriefcaseIcon, CircleCheckIcon, MailIcon, XIcon } from "lucide-react";
import React, { useState } from "react";
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

interface AddDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (doctor: DoctorData) => void;
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
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  status: "Off Duty" | "On Duty" | "On Break" | "On Leave";
}

export const AddDoctorModal = ({
  open,
  onOpenChange,
  onSave,
}: AddDoctorModalProps): JSX.Element => {
  const [formData, setFormData] = useState<DoctorData>({
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
    morningStart: "10:00 AM",
    morningEnd: "1:00 PM",
    eveningStart: "2:00 AM",
    eveningEnd: "6:00 PM",
    status: "On Duty",
  });

  const handleSubmit = () => {
    onSave(formData);
    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({
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
      morningStart: "10:00 AM",
      morningEnd: "1:00 PM",
      eveningStart: "2:00 AM",
      eveningEnd: "6:00 PM",
      status: "On Duty",
    });
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
            Add Doctors
          </DialogTitle>
          <Button
            variant="ghost"
            className="absolute right-4 top-4"
            onClick={handleCloseIcon}
          >
            <XIcon className="w-[24px] h-[24px] text-black" />
          </Button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Doctor Name
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Phone
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
                      day.key as keyof typeof formData.workingDays
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
                Availability (Morning)<span className="text-[#ff0004]">*</span>
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
                Availability(Evening)<span className="text-[#ff0004]">*</span>
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
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as
                    | "Off Duty"
                    | "On Duty"
                    | "On Break"
                    | "On Leave",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Off Duty">Off Duty</SelectItem>
                <SelectItem value="On Duty">On Duty</SelectItem>
                <SelectItem value="On Break">On Break</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-[15px] mt-4">
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="inline-flex items-center gap-[5px] px-[15px] py-1.5 bg-grey-light hover:bg-grey-light/80 rounded-[6px] h-[44px] "
            >
              <XIcon className="w-5 h-5" />
              <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Cancel
              </span>
            </Button>
            <Button
              onClick={handleSubmit}
              className="inline-flex items-center gap-[5px] px-[15px] py-1.5 bg-primary-2 hover:bg-primary-2/90 rounded-[6px] h-[44px]"
            >
              <CircleCheckIcon className="w-5 h-5" />
              <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-white text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                Save
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
