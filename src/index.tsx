import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/toast.css";
import { Patients } from "./screens/Patients";
import { Doctors } from "./screens/Doctors";
import { Appointments } from "./screens/Appointments";
import { Settings } from "./screens/Settings";
import { Login } from "./screens/Login";
import { Signup } from "./screens/Signup";
import { AuthProvider } from "./contexts/AuthProvider";
import { DoctorProvider } from "./contexts/DoctorProvider";
import { PatientProvider } from "./contexts/PatientProvider";
import { AppointmentProvider } from "./contexts/AppointmentProvider";
import { Prescriptions } from "./screens/Prescriptions";
import { PatientRecord } from "./screens/PatientRecord/PatientRecord";
import { Hospitals } from "./screens/Hospitals";
import { Medicines } from "./screens/Medicines";
import { Payment } from "./screens/Payment";
import { HospitalProvider } from "./contexts/HospitalProvider";
import { PrescriptionProvider } from "./contexts/PrescriptionProvider";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DoctorProvider>
          <PatientProvider>
            <HospitalProvider>
              <AppointmentProvider>
                <PrescriptionProvider>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/patients" replace />}
                    />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                    <Route
                      path="/prescriptions/patient/:patientId"
                      element={<PatientRecord />}
                    />
                    <Route path="/hospitals" element={<Hospitals />} />
                    <Route path="/medicines" element={<Medicines />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/doctors" element={<Doctors />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                  <ToastContainer position="top-right" limit={3} />
                </PrescriptionProvider>
              </AppointmentProvider>
            </HospitalProvider>
          </PatientProvider>
        </DoctorProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
