import { Building2, Mail, Phone, Stethoscope } from "lucide-react";
import {
  decodeHtmlEntities,
  getDoctor,
  getHospital,
  formatHospitalAddress,
  formatHospitalPhone,
} from "../../lib/prescriptionMeta";
import type { Prescription } from "../../types/prescription.type";

interface PrescriptionHospitalDoctorInfoProps {
  prescription: Prescription;
}

/**
 * Hospital + treating physician blocks when list/public APIs return populated data.
 */
export const PrescriptionHospitalDoctorInfo = ({
  prescription,
}: PrescriptionHospitalDoctorInfoProps): JSX.Element | null => {
  const hospital = getHospital(prescription);
  const doctor = getDoctor(prescription);

  if (!hospital && !doctor) return null;

  return (
    <div className="flex flex-col gap-4">
      {hospital && (
        <div className="rounded-[10px] border border-[#dedee1] bg-[#fafaf9] p-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-start gap-2">
              <Building2 className="h-5 w-5 text-primary-2 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-title-3m text-black text-base">{hospital.name}</p>
                <p className="font-title-4r text-x-70 text-sm whitespace-pre-line mt-1">
                  {formatHospitalAddress(hospital)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-title-4r text-black">
                <Phone className="h-3.5 w-3.5 text-x-70 shrink-0" />
                {formatHospitalPhone(hospital)}
              </span>
              {hospital.email ? (
                <span className="inline-flex items-center gap-1.5 font-title-4r text-black min-w-0">
                  <Mail className="h-3.5 w-3.5 text-x-70 shrink-0" />
                  <span className="truncate">{hospital.email}</span>
                </span>
              ) : null}
            </div>
            {hospital.registrationNumber ? (
              <p className="font-title-4r text-x-70 text-xs">
                Registration: {hospital.registrationNumber}
              </p>
            ) : null}
            {hospital.contactPerson ? (
              <p className="font-title-4r text-x-70 text-xs">
                Contact: {hospital.contactPerson}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {doctor ? (
        <div className="rounded-[10px] border border-[#dedee1] bg-white p-4">
          <div className="flex items-start gap-2">
            <Stethoscope className="h-5 w-5 text-primary-2 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="font-title-4r text-x-70 text-xs">Treating physician</p>
              <p className="font-title-3m text-black">
                Dr. {decodeHtmlEntities(doctor.fullName)}
              </p>
              {doctor.designation ? (
                <p className="font-title-4r text-x-70 text-sm">
                  {decodeHtmlEntities(doctor.designation)}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm pt-1">
                {doctor.phoneNumber ? (
                  <span className="inline-flex items-center gap-1 font-title-4r text-black">
                    <Phone className="h-3.5 w-3.5 text-x-70" />
                    {decodeHtmlEntities(doctor.phoneNumber)}
                  </span>
                ) : null}
                {doctor.email ? (
                  <span className="inline-flex items-center gap-1 font-title-4r text-black min-w-0">
                    <Mail className="h-3.5 w-3.5 text-x-70 shrink-0" />
                    <span className="truncate">{doctor.email}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
