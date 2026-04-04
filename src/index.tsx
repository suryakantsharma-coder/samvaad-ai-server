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
import { PublicPrescription } from "./screens/PublicPrescription";
import { ensureWhatsAppEmbeddedSignupListener } from "./lib/whatsappConnect";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
  }
}

declare var FB: {
  init: (options: {
    appId: string;
    cookie?: boolean;
    version: string;
    xfbml?: boolean;
  }) => void;
};

const FACEBOOK_APP_ID = (import.meta.env.VITE_FACEBOOK_APP_ID ?? "").trim();

function loadFacebookSdk(): void {
  if (!FACEBOOK_APP_ID) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Facebook] VITE_FACEBOOK_APP_ID is not set — SDK not loaded.",
      );
    }
    return;
  }

  if (document.getElementById("facebook-jssdk")) {
    return;
  }

  window.fbAsyncInit = function () {
    FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: true,
      version: "v24.0",
    });
    if (import.meta.env.DEV) {
      console.log("[Facebook] FB initialized");
    }
  };

  const script = document.createElement("script");
  script.id = "facebook-jssdk";
  script.src = "https://connect.facebook.net/en_US/sdk.js";
  script.async = true;
  script.defer = true;
  script.crossOrigin = "anonymous";
  document.body.appendChild(script);
}

loadFacebookSdk();
ensureWhatsAppEmbeddedSignupListener();

/** Logged-in app: providers, toasts, and main routes (AuthProvider redirects if no token). */
function AuthenticatedApp(): JSX.Element {
  return (
    <AuthProvider>
      <DoctorProvider>
        <PatientProvider>
          <HospitalProvider>
            <AppointmentProvider>
              <PrescriptionProvider>
                <Routes>
                  <Route path="/" element={<Navigate to="/patients" replace />} />
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
  );
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/public/prescriptions/:prescriptionId"
          element={<PublicPrescription />}
        />
        <Route path="*" element={<AuthenticatedApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
