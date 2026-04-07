import { buildMedicineFrequencyLine } from "../../lib/prescriptionMeta";
import type { PrescriptionMedicine } from "../../types/prescription.type";

interface PrescriptionMedicinesSectionProps {
  medicines: PrescriptionMedicine[];
  headingClassName?: string;
}

export const PrescriptionMedicinesSection = ({
  medicines,
  headingClassName = "font-title-3m text-base mb-3",
}: PrescriptionMedicinesSectionProps): JSX.Element => {
  return (
    <div>
      <h2 className={headingClassName}>Medicines</h2>
      <ul className="space-y-3">
        {(medicines ?? []).map((m, i) => (
          <li
            key={`${m.name}-${i}`}
            className="rounded-[10px] border border-[#dedee1] p-4 bg-grey-light/20"
          >
            <p className="font-title-4m text-black">{m.name}</p>
            <p className="font-title-4r text-x-70 text-sm mt-1">
              {m.dosage?.value} {m.dosage?.unit} · {m.duration?.value}{" "}
              {m.duration?.unit} · {m.intake}
              {(m.time?.breakfast || m.time?.lunch || m.time?.dinner) && (
                <span>
                  {" "}
                  ·{" "}
                  {[
                    m.time?.breakfast && "Breakfast",
                    m.time?.lunch && "Lunch",
                    m.time?.dinner && "Dinner",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </p>
            <p className="font-title-4r text-x-70 text-sm mt-1">
              Frequency: {buildMedicineFrequencyLine(m)}
            </p>
            {m.notes ? (
              <p className="font-title-4r text-sm mt-2 text-x-70">{m.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
