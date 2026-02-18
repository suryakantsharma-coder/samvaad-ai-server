import React, { useState } from "react";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { AppointmentHeaderSection } from "./sections/AppointmentHeaderSection";
import { AppointmentListSection } from "./sections/AppointmentListSection";
import {
  MarkAsDoneModal,
  NewAppointmentModal,
  CancelAppointmentModal,
  RescheduleModal,
} from "../../components/modals/AddAppointmentModal";
import { useAppointments } from "../../contexts/AppointmentProvider";

export const Appointments = (): JSX.Element => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarkAsDoneModal, setShowMarkAsDoneModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const { handleMarkAsDoneAppointment, overall, counts } = useAppointments();
  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />
      <AppointmentHeaderSection
        onAddAppointment={() => setShowAddModal(true)}
        totalAppointments={overall?.totalAppointments}
        totalPatients={overall?.totalPatients}
        todayCount={counts.today}
        tomorrowCount={counts.tomorrow}
      />
      <AppointmentListSection
        onCancelAppointment={(appointment) => {
          setShowCancelModal(true);
          setAppointmentData(appointment);
        }}
        onRescheduleAppointment={(appointment) => {
          setShowRescheduleModal(true);
          setAppointmentData(appointment);
        }}
        onMarkAsDoneAppointment={(appointment) => {
          setShowMarkAsDoneModal(true);
          setAppointmentData(appointment);
        }}
      />
      <NewAppointmentModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(payload: {
          patientName: string;
          doctorName: string;
          appointmentDate: string;
          appointmentTime: string;
        }) => {
          setShowAddModal(false);
        }}
      />

      <MarkAsDoneModal
        open={showMarkAsDoneModal}
        onOpenChange={setShowMarkAsDoneModal}
        data={appointmentData}
        onDone={() => {
          setShowMarkAsDoneModal(false);
        }}
        onClose={() => setShowMarkAsDoneModal(false)}
      />

      <CancelAppointmentModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onCancel={() => {}}
        onClose={() => setShowCancelModal(false)}
        data={appointmentData}
      />

      <RescheduleModal
        open={showRescheduleModal}
        onOpenChange={setShowRescheduleModal}
        onReschedule={() => {}}
        onClose={() => setShowRescheduleModal(false)}
        data={appointmentData}
      />
    </div>
  );
};
