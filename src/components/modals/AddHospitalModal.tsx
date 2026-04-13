import { Building2, CircleCheck, Upload, UserPlus, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
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
import { registerUserWithHospital } from "../../data/auth";
import { useHospital } from "../../contexts/HospitalProvider";
import { showSuccess, showError, showWarning } from "../../lib/toast";
import { indianStatesForSelect } from "../../lib/indianStates";
import { validateCreateHospitalForm } from "../../lib/hospitalValidation";
import { CreateHospitalPayload } from "../../types/hospital.type";
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
  modalHeaderCloseButtonClassName,
} from "./modalFooterStyles";

export interface AddHospitalData {
  hospitalName: string;
  phoneCountryCode: string;
  phone: string;
  email: string;
  contactPerson: string;
  gstRegistration: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  teleCallerPrice: string;
  hospitalUrl: string;
  emergencyCountryCode: string;
  emergencyPhone: string;
  receptionistCountryCode: string;
  receptionistPhone: string;
  whatsappCountryCode: string;
  whatsappPhone: string;
  reviewUrls: [string, string];
  pictureFile?: File | null;
  /** First user linked to this hospital (required). */
  memberName: string;
  memberEmail: string;
  memberPassword: string;
  memberRole: "hospital_admin" | "doctor";
}

interface AddHospitalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: AddHospitalData) => void;
}

function createEmptyForm(): AddHospitalData {
  return {
    hospitalName: "",
    phoneCountryCode: "+91",
    phone: "",
    email: "",
    contactPerson: "",
    gstRegistration: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    teleCallerPrice: "",
    hospitalUrl: "",
    emergencyCountryCode: "+91",
    emergencyPhone: "",
    receptionistCountryCode: "+91",
    receptionistPhone: "",
    whatsappCountryCode: "+91",
    whatsappPhone: "",
    reviewUrls: ["", ""],
    pictureFile: null,
    memberName: "",
    memberEmail: "",
    memberPassword: "",
    memberRole: "hospital_admin",
  };
}

const MAX_FILE_SIZE_MB = 5;
const MIN_MEMBER_PASSWORD_LEN = 8;

function validateHospitalMember(fields: {
  memberName: string;
  memberEmail: string;
  memberPassword: string;
}): string | null {
  if (!fields.memberName.trim()) {
    return "Enter the hospital member's full name.";
  }
  const email = fields.memberEmail.trim();
  if (!email) {
    return "Enter the hospital member's email.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email for the hospital member.";
  }
  if (fields.memberPassword.length < MIN_MEMBER_PASSWORD_LEN) {
    return `Member password must be at least ${MIN_MEMBER_PASSWORD_LEN} characters.`;
  }
  return null;
}

/** Local digits only — matches API sample `phoneNumber`: `"9876543210"`. */
function buildLocalPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Country code + local digits — matches API sample `whatsappNumber`: `"919876543210"`. */
function buildDialDigits(countryCode: string, phone: string): string {
  const cc = countryCode.replace(/\D/g, "");
  const p = phone.replace(/\D/g, "");
  return cc ? `${cc}${p}` : p;
}

export const AddHospitalModal = ({
  open,
  onOpenChange,
  onSave,
}: AddHospitalModalProps): JSX.Element => {
  const [formData, setFormData] = useState<AddHospitalData>(createEmptyForm);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { handleCreateHospital } = useHospital();

  const stateOptions = useMemo(
    () => indianStatesForSelect(formData.state),
    [formData.state],
  );

  const handleClose = useCallback(() => {
    setFormData(createEmptyForm());
    setSubmitError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    setSubmitError(null);

    const mainDigits = buildLocalPhoneDigits(formData.phone);
    const waDigits = buildDialDigits(
      formData.whatsappCountryCode,
      formData.whatsappPhone,
    );
    const review0 = formData.reviewUrls[0]?.trim() ?? "";
    const review1 = formData.reviewUrls[1]?.trim() ?? "";

    const validationError = validateCreateHospitalForm({
      hospitalName: formData.hospitalName,
      email: formData.email,
      contactPerson: formData.contactPerson,
      gstRegistration: formData.gstRegistration,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      hospitalUrl: formData.hospitalUrl,
      phoneCountryCode: formData.phoneCountryCode,
      phone: formData.phone,
      whatsappCountryCode: formData.whatsappCountryCode,
      whatsappPhone: formData.whatsappPhone,
      emergencyCountryCode: formData.emergencyCountryCode,
      emergencyPhone: formData.emergencyPhone,
      receptionistCountryCode: formData.receptionistCountryCode,
      receptionistPhone: formData.receptionistPhone,
      reviewUrls: formData.reviewUrls,
      teleCallerPrice: formData.teleCallerPrice,
    });
    if (validationError) {
      setSubmitError(validationError);
      showError("Validation", validationError);
      return;
    }

    const memberError = validateHospitalMember({
      memberName: formData.memberName,
      memberEmail: formData.memberEmail,
      memberPassword: formData.memberPassword,
    });
    if (memberError) {
      setSubmitError(memberError);
      showError("Validation", memberError);
      return;
    }

    const priceNum = Number(formData.teleCallerPrice.trim());
    const payload: CreateHospitalPayload = {
      name: formData.hospitalName.trim(),
      phoneCountryCode: formData.phoneCountryCode.trim() || "+91",
      phoneNumber: mainDigits,
      email: formData.email.trim(),
      contactPerson: formData.contactPerson.trim(),
      registrationNumber: formData.gstRegistration.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      url: formData.hospitalUrl.trim(),
      teleCallerPrice: priceNum,
      emergencyNumber: buildDialDigits(
        formData.emergencyCountryCode,
        formData.emergencyPhone,
      ),
      receptionistNumber: buildDialDigits(
        formData.receptionistCountryCode,
        formData.receptionistPhone,
      ),
      whatsappNumber: waDigits,
      reviewUrls: [review0, review1],
      ...(formData.pictureFile && { logoUrl: formData.pictureFile.name }),
    };

    setIsSubmitting(true);
    try {
      const hospitalId = await handleCreateHospital(payload);
      let memberRegistered = false;
      try {
        await registerUserWithHospital({
          email: formData.memberEmail.trim(),
          password: formData.memberPassword,
          name: formData.memberName.trim(),
          role: formData.memberRole,
          hospitalId,
        });
        memberRegistered = true;
      } catch (memberErr) {
        const msg =
          memberErr instanceof Error ?
            memberErr.message
          : "Failed to register member";
        showWarning(
          "Hospital created",
          `${msg} The hospital exists — add this user later from user management if needed.`,
        );
      }
      const dataToNotify = formData;
      setFormData(createEmptyForm());
      onOpenChange(false);
      onSave?.(dataToNotify);
      if (memberRegistered) {
        showSuccess(
          "Success!",
          "Hospital and member account created successfully.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create hospital";
      setSubmitError(message);
      showError("Error", message);
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

  const setReviewUrl = useCallback((index: 0 | 1, value: string) => {
    setFormData((prev) => {
      const next: [string, string] = [...prev.reviewUrls] as [string, string];
      next[index] = value;
      return { ...prev, reviewUrls: next };
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] w-[90vw] p-0 gap-0 rounded-[10px] border border-[#dedee1] overflow-hidden [&>button]:hidden max-h-[90vh] flex flex-col">
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
            className={modalHeaderCloseButtonClassName}
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
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
                Phone number<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.phoneCountryCode}
                  onValueChange={(v) =>
                    setFormData({ ...formData, phoneCountryCode: v })
                  }
                >
                  <SelectTrigger className="h-[38px] w-[90px] shrink-0 px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="9876543210"
                  className="h-[38px] flex-1 px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
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
                placeholder="REG123"
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

          {/* City | State */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                City<span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="e.g. Mumbai"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                State<span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.state || undefined}
                onValueChange={(v) =>
                  setFormData({ ...formData, state: v })
                }
              >
                <SelectTrigger className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(280px,50vh)]">
                  {stateOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pincode | Tele caller price */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Pincode<span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                placeholder="400001"
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Tele caller price<span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={formData.teleCallerPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    teleCallerPrice: e.target.value,
                  })
                }
                placeholder="499"
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
              placeholder="https://example.com"
              className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
            />
          </div>

          {/* Hospital member — at least one user linked on create */}
          <div className="rounded-[10px] border border-[#dedee1] bg-grey-light/40 p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-2/10 text-primary-2">
                <UserPlus className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                  Assign hospital member<span className="text-red-500">*</span>
                </p>
                <p className="font-title-5l text-x-70 text-xs mt-0.5">
                  Create one login (hospital admin or doctor) for this hospital.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 lg:col-span-2">
                <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                  Member full name<span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.memberName}
                  onChange={(e) =>
                    setFormData({ ...formData, memberName: e.target.value })
                  }
                  placeholder="e.g. Dr. Priya Sharma"
                  className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                  Member email<span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.memberEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, memberEmail: e.target.value })
                  }
                  placeholder="admin@hospital.com"
                  className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                  Member password<span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.memberPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, memberPassword: e.target.value })
                  }
                  placeholder={`Min. ${MIN_MEMBER_PASSWORD_LEN} characters`}
                  className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-2 lg:col-span-2">
                <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                  Role<span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.memberRole}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      memberRole: v as "hospital_admin" | "doctor",
                    })
                  }
                >
                  <SelectTrigger className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital_admin">
                      Hospital admin
                    </SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              WhatsApp number<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Select
                value={formData.whatsappCountryCode}
                onValueChange={(v) =>
                  setFormData({ ...formData, whatsappCountryCode: v })
                }
              >
                <SelectTrigger className="w-[90px] h-[38px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
              </Select>
              <Input
                type="tel"
                value={formData.whatsappPhone}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappPhone: e.target.value })
                }
                placeholder="9876543210"
                className="flex-1 h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
          </div>

          {/* Emergency | Receptionist — same layout as WhatsApp (+91 + number) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Emergency number<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.emergencyCountryCode}
                  onValueChange={(v) =>
                    setFormData({ ...formData, emergencyCountryCode: v })
                  }
                >
                  <SelectTrigger className="w-[90px] h-[38px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyPhone: e.target.value,
                    })
                  }
                  placeholder="9876543210"
                  className="flex-1 h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Receptionist number<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={formData.receptionistCountryCode}
                  onValueChange={(v) =>
                    setFormData({ ...formData, receptionistCountryCode: v })
                  }
                >
                  <SelectTrigger className="w-[90px] h-[38px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={formData.receptionistPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receptionistPhone: e.target.value,
                    })
                  }
                  placeholder="9876543210"
                  className="flex-1 h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
                />
              </div>
            </div>
          </div>

          {/* Review URLs */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Review URL 1<span className="text-red-500">*</span>
              </label>
              <Input
                type="url"
                value={formData.reviewUrls[0]}
                onChange={(e) => setReviewUrl(0, e.target.value)}
                placeholder="https://g.page/r/..."
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                Review URL 2<span className="text-red-500">*</span>
              </label>
              <Input
                type="url"
                value={formData.reviewUrls[1]}
                onChange={(e) => setReviewUrl(1, e.target.value)}
                placeholder="https://www.practo.com/..."
                className="h-[38px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px] font-title-4r placeholder:text-x-70"
              />
            </div>
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
          <div className={`${modalFooterRowClassName} pt-2 border-t border-[#dedee1]`}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className={modalFooterCancelClassName}
              leadingIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSubmitting}
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
