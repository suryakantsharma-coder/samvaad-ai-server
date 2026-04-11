import { ChevronDownIcon, CircleCheck, UserIcon, X } from "lucide-react";
import { useState } from "react";
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
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
  modalHeaderCloseButtonClassName,
} from "./modalFooterStyles";

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patient: PatientData) => void | Promise<void>;
}

export interface PatientData {
  name: string;
  age: number;
  phone: string;
  gender: string;
  reason: string;
  countryCode: string;
}

export const AddPatientModal = ({
  open,
  onOpenChange,
  onSave,
}: AddPatientModalProps): JSX.Element => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PatientData>({
    name: "",
    age: 0,
    phone: "",
    gender: "Male",
    reason: "",
    countryCode: "+91",
  });

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onSave(formData));
      setFormData({
        name: "",
        age: 0,
        phone: "",
        gender: "Male",
        reason: "",
        countryCode: "+91",
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      age: 0,
      phone: "",
      gender: "Male",
      reason: "",
      countryCode: "+91",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] w-[90vw] p-0 gap-0 rounded-[10px] border border-[#dedee1] overflow-hidden [&>button]:hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-[#dedee1] bg-grey-light rounded-t-[10px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-[2px] rounded-[50px] bg-white border border-[#dedee1]">
              <UserIcon className="w-4 h-4 text-black" />
            </div>
            <DialogTitle className="font-title-3m text-sm font-semibold text-gray-700">
              Add Patient
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className={modalHeaderCloseButtonClassName}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </DialogHeader>

        <div className="px-5 py-5 flex flex-col gap-[15px] overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
              Patient Name<span className="text-[#ff0004]">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Type name"
              className="h-[38px] px-4 py-[5px] bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Age<span className="text-[#ff0004]">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      age: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-0">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, age: formData.age + 1 })
                    }
                    className="h-3 flex items-center justify-center"
                  >
                    <ChevronDownIcon className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        age: Math.max(0, formData.age - 1),
                      })
                    }
                    className="h-3 flex items-center justify-center"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Gender<span className="text-[#ff0004]">*</span>
              </label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                  <div className="flex items-center gap-2.5">
                    {/* <img
                      src={
                        formData.gender === "Male" ? "/male.svg" : "/female.svg"
                      }
                      alt={formData.gender}
                      className="w-5 h-5"
                    /> */}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">
                    <div className="flex items-center gap-2.5">
                      <img src="/male.svg" alt="Male" className="w-5 h-5" />
                      <span>Male</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Female">
                    <div className="flex items-center gap-2.5">
                      <img src="/female.svg" alt="Female" className="w-5 h-5" />
                      <span>Female</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Phone<span className="text-[#ff0004]">*</span>
              </label>
              <div className="flex gap-2.5">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) =>
                    setFormData({ ...formData, countryCode: value })
                  }
                >
                  <SelectTrigger className="w-[100px] h-[38px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
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
                  className="flex-1 h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Reason<span className="text-[#ff0004]">*</span>
              </label>
              <Input
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Type reason"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] placeholder:text-x-70"
              />
            </div>
          </div>

          {/* Previous footer (rounded pills + title typography) — restore if needed:
          <div className="flex justify-end gap-[15px]">
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="inline-flex items-center gap-[5px] px-[15px] py-1.5 bg-grey-light hover:bg-grey-light/80 rounded-[6px] h-[44px]"
            >
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
          */}
          <div className={modalFooterRowClassName}>
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
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
