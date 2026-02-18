import { Building2, Check, Upload, X } from "lucide-react";
import React, { useCallback, useState } from "react";
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
import { useHospital } from "../../contexts/HospitalProvider";
import { CreateHospitalPayload } from "../../types/hospital.type";

export interface AddHospitalData {
  hospitalName: string;
  countryCode: string;
  phone: string;
  email: string;
  contactPerson: string;
  gstRegistration: string;
  address: string;
  city: string;
  pincode: string;
  hospitalUrl: string;
  pictureFile?: File | null;
}

interface AddHospitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: AddHospitalData) => void;
}

const DEFAULT_FORM: AddHospitalData = {
  hospitalName: "",
  countryCode: "+91",
  phone: "569 334 3366",
  email: "",
  contactPerson: "",
  gstRegistration: "",
  address: "",
  city: "",
  pincode: "",
  hospitalUrl: "",
  pictureFile: null,
};

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Surat",
  "Indore",
  "Bhopal",
  "Vadodara",
  "Kochi",
  "Bengaluru",
  "Nashik",
  "Thane",
  "Navi Mumbai",
  "Pimpri-Chinchwad",
  "Aurangabad",
  "Noida",
  "Faridabad",
  "Gurgaon",
  "Jalandhar",
  "Ludhiana",
  "Patna",
  "Ranchi",
  "Bhubaneswar",
  "Visakhapatnam",
  "Vijayawada",
  "Thiruvananthapuram",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
];

const MAX_FILE_SIZE_MB = 5;

export const AddHospitalModal = ({
  open,
  onOpenChange,
  onSave,
}: AddHospitalModalProps): JSX.Element => {
  const [formData, setFormData] = useState<AddHospitalData>(DEFAULT_FORM);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { handleCreateHospital } = useHospital();

  const handleClose = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setSubmitError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    setSubmitError(null);
    const payload: CreateHospitalPayload = {
      name: formData.hospitalName,
      phoneCountryCode: formData.countryCode,
      phoneNumber: formData.phone,
      email: formData.email,
      contactPerson: formData.contactPerson,
      registrationNumber: formData.gstRegistration,
      address: formData.address,
      city: formData.city,
      pincode: formData.pincode,
      url: formData.hospitalUrl,
      logoUrl: formData.pictureFile?.name ?? "",
    };

    setIsSubmitting(true);
    try {
      await handleCreateHospital(payload);
      const dataToNotify = formData;
      setFormData(DEFAULT_FORM);
      onOpenChange(false);
      onSave?.(dataToNotify);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create hospital";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, handleCreateHospital, onOpenChange, onSave]);

  const handleFile = useCallback((file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return;
    setFormData((prev) => ({ ...prev, pictureFile: file ?? undefined }));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] w-[90vw] p-0 gap-0 rounded-[10px] border border-[#dedee1] overflow-hidden [&>button]:hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-[#dedee1] bg-grey-light rounded-t-[10px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-[2px] rounded-[50px] bg-white border border-[#dedee1]">
              <Building2 className="w-4 h-4 text-black" />
            </div>
            <DialogTitle className="font-title-3m text-sm font-semibold text-gray-700">
              Add Hospital
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

        <div className="px-5 py-5 flex flex-col gap-4 overflow-y-auto">
          {/* Hospital Name - full width */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Hospital Name<span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.hospitalName}
              onChange={(e) =>
                setFormData({ ...formData, hospitalName: e.target.value })
              }
              placeholder="Type hospital name"
              className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
            />
          </div>

          {/* Phone | Email */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Phone<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.countryCode}
                  onValueChange={(v) =>
                    setFormData({ ...formData, countryCode: v })
                  }
                >
                  <SelectTrigger className="w-[90px] h-[38px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
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
                  className="flex-1 h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Email Address<span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Hospital@gmail.com"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
          </div>

          {/* Contact Person | GST/Registration No. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Contact Person<span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                placeholder="Type name"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                GST/Registration No.<span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.gstRegistration}
                onChange={(e) =>
                  setFormData({ ...formData, gstRegistration: e.target.value })
                }
                placeholder="Type name"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
          </div>

          {/* Address - full width */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Address<span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Hospital address"
              className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
            />
          </div>

          {/* City | Pincode */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                City<span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.city || undefined}
                onValueChange={(v) => setFormData({ ...formData, city: v })}
              >
                <SelectTrigger className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Pincode<span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                placeholder="Type pincode"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
          </div>

          {/* Hospital URL - full width */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Hospital URL<span className="text-red-500">*</span>
            </label>
            <Input
              type="url"
              value={formData.hospitalUrl}
              onChange={(e) =>
                setFormData({ ...formData, hospitalUrl: e.target.value })
              }
              placeholder="URL here"
              className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
            />
          </div>

          {/* Upload Picture */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Upload Picture
            </label>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`min-h-[140px] rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 px-4 transition-colors ${
                isDragging
                  ? "border-primary-2 bg-primary-2/5"
                  : "border-[#dedee1] bg-grey-light/30"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="hospital-picture-upload"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="hospital-picture-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-10 h-10 text-x-70" />
                <span className="font-title-4m text-black text-sm">
                  Upload Picture
                </span>
                <span className="font-title-5l text-x-70 text-xs">
                  or drag and drop it here (Max 5MB)
                </span>
              </label>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 font-title-4r">{submitError}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[#dedee1]">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex items-center gap-[5px] px-4 py-2 bg-grey-light hover:bg-grey-light/80 rounded-[6px] h-[44px] text-gray-600 font-title-4r"
            >
              <X className="w-5 h-5" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-[5px] px-4 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[6px] h-[44px] text-white font-title-4r disabled:opacity-60"
            >
              <Check className="w-5 h-5" />
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
