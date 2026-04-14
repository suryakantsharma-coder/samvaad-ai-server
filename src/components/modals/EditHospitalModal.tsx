import { Building2, CircleCheck, Upload, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { API_BASE_URL } from "../../config";
import { useHospital } from "../../contexts/HospitalProvider";
import { showSuccess, showError } from "../../lib/toast";
import { validateCreateHospitalForm } from "../../lib/hospitalValidation";
import { indianStatesForSelect } from "../../lib/indianStates";
import type { Hospital, UpdateHospitalPayload } from "../../types/hospital.type";
import {
  modalFooterCancelClassName,
  modalFooterPrimaryClassName,
  modalFooterRowClassName,
  modalHeaderCloseButtonClassName,
} from "./modalFooterStyles";

export interface EditHospitalFormData {
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
}

function hospitalToForm(h: Hospital): EditHospitalFormData {
  const digitsOnly = (s: string) => s.replace(/\D/g, "");
  const splitDial = (raw: string | undefined): { cc: string; national: string } => {
    const d = digitsOnly(raw ?? "");
    if (d.length >= 12 && d.startsWith("91")) {
      return { cc: "+91", national: d.slice(2) };
    }
    if (d.length === 10) return { cc: "+91", national: d };
    return { cc: "+91", national: d };
  };

  const mainNational = digitsOnly(h.phoneNumber);
  const wa = splitDial(h.whatsappNumber);
  const em = splitDial(h.emergencyNumber);
  const rec = splitDial(h.receptionistNumber);
  const rev = h.reviewUrls ?? [];
  const price =
    h.teleCallerPrice != null && Number.isFinite(Number(h.teleCallerPrice)) ?
      String(h.teleCallerPrice)
    : "";

  return {
    hospitalName: h.name ?? "",
    phoneCountryCode: (h.phoneCountryCode ?? "+91").trim() || "+91",
    phone: mainNational,
    email: h.email ?? "",
    contactPerson: h.contactPerson ?? "",
    gstRegistration: h.registrationNumber ?? "",
    address: h.address ?? "",
    city: h.city ?? "",
    state: (h.state ?? "").trim(),
    pincode: h.pincode ?? "",
    teleCallerPrice: price,
    hospitalUrl: h.url ?? "",
    emergencyCountryCode: em.cc,
    emergencyPhone: em.national,
    receptionistCountryCode: rec.cc,
    receptionistPhone: rec.national,
    whatsappCountryCode: wa.cc,
    whatsappPhone: wa.national,
    reviewUrls: [rev[0] ?? "", rev[1] ?? ""],
    pictureFile: null,
  };
}

function buildLocalPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildDialDigits(countryCode: string, phone: string): string {
  const cc = countryCode.replace(/\D/g, "");
  const p = phone.replace(/\D/g, "");
  return cc ? `${cc}${p}` : p;
}

function existingLogoSrc(logoUrl?: string): string | undefined {
  if (!logoUrl?.trim()) return undefined;
  const t = logoUrl.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `${API_BASE_URL}${t.startsWith("/") ? "" : "/"}${t}`;
}

const MAX_FILE_SIZE_MB = 5;

export interface EditHospitalModalProps {
  hospital: Hospital;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditHospitalModal = ({
  hospital,
  open,
  onOpenChange,
}: EditHospitalModalProps): JSX.Element => {
  const { patchHospital } = useHospital();
  const [formData, setFormData] = useState<EditHospitalFormData>(() =>
    hospitalToForm(hospital),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stateOptions = useMemo(
    () => indianStatesForSelect(formData.state),
    [formData.state],
  );

  const handleClose = useCallback(() => {
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

    const priceNum = Number(formData.teleCallerPrice.trim());
    const payload: UpdateHospitalPayload = {
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
    };

    setIsSubmitting(true);
    try {
      await patchHospital(
        hospital._id,
        payload,
        formData.pictureFile ?? undefined,
      );
      showSuccess("Saved", "Hospital details were updated.");
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update hospital";
      setSubmitError(message);
      showError("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, hospital, onOpenChange, patchHospital]);

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

  const previewBlobUrl = useMemo(() => {
    if (!formData.pictureFile) return null;
    return URL.createObjectURL(formData.pictureFile);
  }, [formData.pictureFile]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const logoPreview =
    previewBlobUrl ?? existingLogoSrc(hospital.logoUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] w-[90vw] p-0 gap-0 rounded-[10px] border border-[#dedee1] overflow-hidden [&>button]:hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 px-5 py-4 border-b border-[#dedee1] bg-grey-light rounded-t-[10px]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center p-[2px] rounded-[50px] bg-white border border-[#dedee1]">
              <Building2 className="w-4 h-4 text-black" />
            </div>
            <DialogTitle className="font-title-3m text-sm font-semibold text-gray-700">
              Edit Hospital
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
                onValueChange={(v) => setFormData({ ...formData, state: v })}
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

          <div className="flex flex-col gap-2">
            <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
              Hospital logo
            </label>
            {logoPreview ? (
              <div className="flex items-center gap-3 mb-1">
                <img
                  src={logoPreview}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-[#dedee1]"
                />
                <span className="font-title-5l text-x-70 text-xs">
                  Current or new image — upload below to replace
                </span>
              </div>
            ) : null}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`min-h-[120px] rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center gap-2 py-5 px-4 transition-colors ${
                isDragging
                  ? "border-primary-2 bg-primary-2/5"
                  : "border-[#dedee1] bg-grey-light/30"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="edit-hospital-picture-upload"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="edit-hospital-picture-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-10 h-10 text-x-70" />
                <span className="font-title-4m text-black text-sm">
                  Replace logo
                </span>
                <span className="font-title-5l text-x-70 text-xs">
                  or drag and drop (max 5MB)
                </span>
              </label>
            </div>
          </div>

          {submitError ? (
            <p className="text-sm text-red-600 font-title-4r">{submitError}</p>
          ) : null}

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
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
