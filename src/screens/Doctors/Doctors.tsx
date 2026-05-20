import React, { useState } from "react";
import { DoctorHeaderSection } from "./sections/DoctorHeaderSection";
import { DoctorListSection } from "./sections/DoctorListSection";
import {
  AddDoctorModal,
  type DoctorData,
} from "../../components/modals/AddDoctorModal";
import { DeleteDoctorModal } from "../../components/modals/DeleteDoctorModal";
import { useDoctor } from "../../contexts/DoctorProvider";
import type { Doctor } from "../../types/doctor.type";
import { CreateDoctorPayload } from "../../types/doctor.type";

/** Same separator as `DoctorListSection` uses when splitting availability lines. */
const AVAILABILITY_LINE_SEP = "&#x2F;n";

function doctorDataToPayload(
  doctor: DoctorData,
  options?: { includeUtilization?: boolean },
): CreateDoctorPayload {
  const timing = `${doctor.morningStart} - ${doctor.morningEnd}${AVAILABILITY_LINE_SEP}${doctor.eveningStart} - ${doctor.eveningEnd}`;
  const payload: CreateDoctorPayload = {
    fullName: doctor.name,
    phoneNumber: `${doctor.countryCode} ${doctor.phone}`.trim(),
    designation: doctor.designation,
    averagePatientTime: doctor.averagePatientTime,
    availability: timing,
    status: doctor.status,
    email: doctor.email,
  };
  if (options?.includeUtilization) {
    payload.utilization = 0;
  }
  if (doctor.holidays !== undefined) {
    payload.holidays = doctor.holidays;
  }
  return payload;
}

export const Doctors = (): JSX.Element => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorPendingDelete, setDoctorPendingDelete] = useState<Doctor | null>(
    null,
  );
  const { handleAddDoctor, handleUpdateDoctor, handleDeleteDoctor, overall } =
    useDoctor();

  const doctorModalOpen = showAddModal || editingDoctor !== null;

  const handleCloseDoctorModal = (open: boolean) => {
    if (!open) {
      setShowAddModal(false);
      setEditingDoctor(null);
    }
  };

  const handleSaveDoctor = async (doctor: DoctorData) => {
    await handleAddDoctor(
      doctorDataToPayload(doctor, { includeUtilization: true }),
    );
  };

  const handleUpdateDoctorSubmit = async (
    doctorId: string,
    doctor: DoctorData,
  ) => {
    await handleUpdateDoctor(doctorId, doctorDataToPayload(doctor));
    setEditingDoctor(null);
  };

  return (
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <DoctorHeaderSection
        totalDoctors={overall?.totalDoctors}
        onAddDoctor={() => {
          setEditingDoctor(null);
          setShowAddModal(true);
        }}
      />
      <DoctorListSection
        onEditDoctor={(d) => setEditingDoctor(d)}
        onRemoveDoctor={(d) => setDoctorPendingDelete(d)}
      />
      <AddDoctorModal
        open={doctorModalOpen}
        onOpenChange={handleCloseDoctorModal}
        onSave={handleSaveDoctor}
        initialDoctor={editingDoctor}
        onUpdate={handleUpdateDoctorSubmit}
      />
      <DeleteDoctorModal
        open={doctorPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDoctorPendingDelete(null);
        }}
        onClose={() => setDoctorPendingDelete(null)}
        doctor={doctorPendingDelete}
        onConfirm={async () => {
          if (!doctorPendingDelete) return;
          await handleDeleteDoctor(doctorPendingDelete._id);
        }}
      />
    </div>
  );
};
