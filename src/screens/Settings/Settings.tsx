import { useEffect, useMemo, useState } from "react";
import { PatientSearchSection } from "../Patients/sections/PatientSearchSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import {
  UserIcon,
  BuildingIcon,
  ClockIcon,
  Trash2Icon,
  UploadIcon,
  BellIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthProvider";
import { useHospital } from "../../contexts/HospitalProvider";
import { showSuccess, showError, showWarning } from "../../lib/toast";
import { connectWhatsAppEmbeddedSignup } from "../../lib/whatsappConnect";
import { getHospitalUsers, updateCurrentUserProfile } from "../../data/auth";
import {
  fetchWhatsappCredsForOnboarding,
  getWhatsappOnboardingStatus,
  hasWhatsappHospitalCreds,
} from "../../data/whatsapp";
import {
  defaultOnboardingSteps,
  extractGraphCredsFromCredsApi,
  isOnboardingFullyComplete,
  runWhatsappGraphOnboarding,
  stepsFromOnboardingFlags,
  type WhatsappOnboardingStepState,
} from "../../lib/whatsappGraphOnboarding";
import type { User } from "../../types/auth.type";
import { ChangePasswordModal } from "../../components/modals";

/** Split stored phone (e.g. "+91 9876543210" or "9876543210") for the personal form. */
function splitPhoneForForm(raw: string | undefined | null): {
  countryCode: string;
  national: string;
} {
  if (raw == null || String(raw).trim() === "") {
    return { countryCode: "+91", national: "" };
  }
  const p = String(raw).trim();
  const m = p.match(/^(\+\d{1,4})\s*(.*)$/);
  if (m) {
    const rest = m[2].replace(/\s/g, "").trim();
    return { countryCode: m[1], national: rest };
  }
  return { countryCode: "+91", national: p.replace(/\D/g, "") };
}

export const Settings = (): JSX.Element => {
  const { user, refreshUser } = useAuth();
  const {
    currentHospital,
    currentHospitalLoading,
    currentHospitalError,
    fetchHospitalById,
    updateHospitalById,
  } = useHospital();
  const isHospitalAdmin = user?.role === "hospital_admin";
  /** Hospital + Integrations & Notifications (and notification sidebar on Personal). */
  const canManageHospitalIntegrations =
    user?.role === "admin" || user?.role === "hospital_admin";

  const settingsTabs = useMemo(() => {
    const tabs: Array<{ id: string; label: string; icon: typeof UserIcon }> = [
      { id: "personal", label: "Personal", icon: UserIcon },
    ];
    if (canManageHospitalIntegrations) {
      tabs.push(
        { id: "hospital", label: "Hospital", icon: BuildingIcon },
        {
          id: "integrations",
          label: "Integrations & Notifications",
          icon: BellIcon,
        },
      );
    }
    if (isHospitalAdmin) {
      tabs.push({ id: "auth", label: "Auth", icon: ShieldCheckIcon });
    }
    return tabs;
  }, [canManageHospitalIntegrations, isHospitalAdmin]);

  const [activeTab, setActiveTab] = useState<string>("personal");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    if (!isHospitalAdmin && activeTab === "auth") {
      setActiveTab("personal");
    }
  }, [isHospitalAdmin, activeTab]);

  useEffect(() => {
    if (
      !canManageHospitalIntegrations &&
      (activeTab === "hospital" || activeTab === "integrations")
    ) {
      setActiveTab("personal");
    }
  }, [canManageHospitalIntegrations, activeTab]);

  useEffect(() => {
    if (activeTab === "auth" && isHospitalAdmin) {
      setUsersLoading(true);
      getHospitalUsers(user?._id ?? "")
        .then((res) => {
          const data = res as { data?: { users?: User[] }; users?: User[] };
          const list = data?.data?.users ?? data?.users ?? [];
          setHospitalUsers(Array.isArray(list) ? list : []);
        })
        .catch(() => setHospitalUsers([]))
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab, isHospitalAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRoleId(userId);
    try {
      setHospitalUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to update role",
      );
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleAddUserSuccess = () => {
    setAddUserSuccess(true);
    setNewUserForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "doctor",
    });
    getHospitalUsers(user?._id ?? "")
      .then((res) => {
        const data = res as { data?: { users?: User[] }; users?: User[] };
        const list = data?.data?.users ?? data?.users ?? [];
        setHospitalUsers(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  };

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "doctor",
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserSuccess, setAddUserSuccess] = useState(false);
  const [hospitalUsers, setHospitalUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [listUpdating, setListUpdating] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    countryCode: "+91",
    email: "",
    hospitalName: "",
    address: "",
    hospitalId: "",
    city: "",
    pincode: "",
    workingHours: "8:00 AM - 9:00 PM",
    phoneRouting: "",
    phoneRoutingCountryCode: "+91",
    whatsappNumber: "",
    whatsappCountryCode: "+91",
    officialEmail: "",
  });

  useEffect(() => {
    if (!user) return;
    const rawPhone = user.phoneNumber ?? user.phone;
    setFormData((prev) => {
      const next = {
        ...prev,
        fullName: user.name ?? prev.fullName,
        email: user.email ?? prev.email,
      };
      if (rawPhone != null && String(rawPhone).trim() !== "") {
        const { countryCode, national } = splitPhoneForForm(String(rawPhone));
        next.countryCode = countryCode;
        next.phone = national;
      }
      return next;
    });
  }, [user?._id, user?.name, user?.email, user?.phoneNumber, user?.phone]);

  // Fetch hospital when viewing hospital tab and user has a linked hospital
  useEffect(() => {
    if (activeTab === "hospital" && user?.hospital) {
      fetchHospitalById(user.hospital);
    }
  }, [activeTab, user?.hospital]);

  // Fill hospital form when currentHospital is loaded
  useEffect(() => {
    if (currentHospital) {
      setFormData((prev) => ({
        ...prev,
        hospitalName: currentHospital.name ?? prev.hospitalName,
        address: currentHospital.address ?? prev.address,
        hospitalId: currentHospital._id ?? prev.hospitalId,
        city: currentHospital.city ?? prev.city,
        pincode: currentHospital.pincode ?? prev.pincode,
        phoneRouting: currentHospital.phoneNumber ?? prev.phoneRouting,
        phoneRoutingCountryCode:
          currentHospital.phoneCountryCode ?? prev.phoneRoutingCountryCode,
        officialEmail: currentHospital.email ?? prev.officialEmail,
        whatsappNumber: currentHospital.phoneNumber ?? prev.whatsappNumber,
      }));
    }
  }, [currentHospital]);

  const [hospitalSaveLoading, setHospitalSaveLoading] = useState(false);
  const [hospitalSaveError, setHospitalSaveError] = useState<string | null>(
    null,
  );
  const [personalSaveLoading, setPersonalSaveLoading] = useState(false);

  const [integrations, setIntegrations] = useState({
    whatsapp: true,
  });

  const settingsHospitalId = useMemo(
    () => (typeof user?.hospital === "string" ? user.hospital.trim() : ""),
    [user?.hospital],
  );

  const [whatsappCredsLinked, setWhatsappCredsLinked] = useState(false);
  const [whatsappCredsLoading, setWhatsappCredsLoading] = useState(false);
  const [whatsappOnboardingComplete, setWhatsappOnboardingComplete] =
    useState(false);
  const [whatsappOnboardingSteps, setWhatsappOnboardingSteps] = useState<
    WhatsappOnboardingStepState[]
  >(() => defaultOnboardingSteps());
  const [whatsappOnboardingRunning, setWhatsappOnboardingRunning] =
    useState(false);

  useEffect(() => {
    if (activeTab !== "integrations" || !settingsHospitalId) return;
    let cancelled = false;
    void getWhatsappOnboardingStatus(settingsHospitalId).then((flags) => {
      if (cancelled) return;
      if (!flags) {
        setWhatsappOnboardingComplete(false);
        setWhatsappOnboardingSteps(defaultOnboardingSteps());
        return;
      }
      setWhatsappOnboardingComplete(isOnboardingFullyComplete(flags));
      setWhatsappOnboardingSteps(
        stepsFromOnboardingFlags(
          flags.registrationPhone,
          flags.subscribeApp,
          flags.verifyRegistration,
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, settingsHospitalId]);

  useEffect(() => {
    if (activeTab !== "integrations") return;
    if (!settingsHospitalId) {
      setWhatsappCredsLinked(false);
      setWhatsappCredsLoading(false);
      return;
    }
    let cancelled = false;
    setWhatsappCredsLoading(true);
    hasWhatsappHospitalCreds(settingsHospitalId)
      .then((linked) => {
        if (!cancelled) setWhatsappCredsLinked(linked);
      })
      .finally(() => {
        if (!cancelled) setWhatsappCredsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, settingsHospitalId]);

  useEffect(() => {
    if (!settingsHospitalId) return;
    const refresh = () => {
      void hasWhatsappHospitalCreds(settingsHospitalId).then((linked) =>
        setWhatsappCredsLinked(linked),
      );
    };
    window.addEventListener("samvaad:whatsapp-creds-stored", refresh);
    return () =>
      window.removeEventListener("samvaad:whatsapp-creds-stored", refresh);
  }, [settingsHospitalId]);

  const handleWhatsAppConnect = () => {
    if (!integrations.whatsapp) return;
    const result = connectWhatsAppEmbeddedSignup(
      typeof user?.hospital === "string" ? user.hospital : undefined,
    );
    if (!result.ok) {
      if (result.reason === "no_config") {
        showError(
          "WhatsApp",
          "Set VITE_META_WHATSAPP_CONFIG_ID to your Meta Embedded Signup configuration ID.",
        );
        return;
      }
      if (result.reason === "no_hospital") {
        showError(
          "WhatsApp",
          "Your account must be linked to a hospital before connecting WhatsApp.",
        );
        return;
      }
      showError(
        "WhatsApp",
        "Facebook SDK is not loaded. Check VITE_FACEBOOK_APP_ID and refresh the page.",
      );
    }
  };

  const handleWhatsappStartOnboarding = async () => {
    if (!settingsHospitalId || whatsappOnboardingRunning) return;
    setWhatsappOnboardingRunning(true);
    setWhatsappOnboardingSteps(defaultOnboardingSteps());
    setWhatsappOnboardingComplete(false);
    try {
      const raw = await fetchWhatsappCredsForOnboarding(settingsHospitalId);
      const creds = extractGraphCredsFromCredsApi(raw);
      if (!creds) {
        showError(
          "WhatsApp",
          "Could not read phone_number_id, waba_id, or access_token from your server's creds response. Check the API payload shape.",
        );
        return;
      }
      const pin =
        import.meta.env.VITE_WHATSAPP_REGISTER_PIN?.trim() || "123456";
      await runWhatsappGraphOnboarding({
        hospitalId: settingsHospitalId,
        phoneNumberId: creds.phoneNumberId,
        wabaId: creds.wabaId,
        accessToken: creds.accessToken,
        pin,
        onStepUpdate: setWhatsappOnboardingSteps,
        onStepError: (label, msg) =>
          showError("WhatsApp onboarding", `${label}: ${msg}`),
      });
      const refreshed = await getWhatsappOnboardingStatus(settingsHospitalId);
      if (refreshed) {
        setWhatsappOnboardingSteps(
          stepsFromOnboardingFlags(
            refreshed.registrationPhone,
            refreshed.subscribeApp,
            refreshed.verifyRegistration,
          ),
        );
        const complete = isOnboardingFullyComplete(refreshed);
        setWhatsappOnboardingComplete(complete);
        if (complete) {
          showSuccess(
            "WhatsApp",
            "All onboarding steps completed. WhatsApp is connected.",
          );
        }
      }
    } finally {
      setWhatsappOnboardingRunning(false);
    }
  };

  const [notifications, setNotifications] = useState({
    newAppointment: true,
    appointmentReminder: true,
    appointmentRescheduled: true,
  });

  const handleSavePersonal = async () => {
    setPersonalSaveLoading(true);
    try {
      const payload: Parameters<typeof updateCurrentUserProfile>[0] = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
      };
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits) {
        payload.phoneNumber = phoneDigits;
      }
      const hasChange =
        Boolean(payload.name) ||
        Boolean(payload.email) ||
        Boolean(payload.phoneNumber);
      if (!hasChange) {
        showWarning(
          "Warning",
          "Update your name, email, or phone, or use Change password.",
        );
        return;
      }
      await updateCurrentUserProfile(payload);
      await refreshUser();
      showSuccess("Success!", "Your profile was updated.");
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setPersonalSaveLoading(false);
    }
  };

  const handleSaveHospital = async () => {
    const hospitalId = user?.hospital as string | undefined;
    if (!hospitalId) {
      setHospitalSaveError("No hospital linked to your account.");
      return;
    }
    setHospitalSaveError(null);
    setHospitalSaveLoading(true);
    try {
      await updateHospitalById(hospitalId, {
        name: formData.hospitalName || undefined,
        phoneNumber: formData.phoneRouting || undefined,
        email: formData.officialEmail || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        pincode: formData.pincode || undefined,
      });
      showSuccess("Success!", "Hospital information updated successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update hospital";
      setHospitalSaveError(msg);
      showError("Error", msg);
    } finally {
      setHospitalSaveLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserForm.password !== newUserForm.confirmPassword) {
      showWarning("Warning", "Passwords do not match.");
      return;
    }
    if (!newUserForm.email || !newUserForm.name || !newUserForm.password) {
      showWarning("Warning", "Please fill in name, email, and password.");
      return;
    }
    setAddUserLoading(true);
    setAddUserSuccess(false);
    try {
      await handleRegister(
        newUserForm.email,
        newUserForm.password,
        newUserForm.name,
        "user",
        user?.hospital as string,
      );
      handleAddUserSuccess();
      showSuccess("Success!", "User created successfully.");
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to create user",
      );
    } finally {
      setAddUserLoading(false);
    }
  };

  // hospital users list + role assign

  const {
    handleGetHospitalUsers,
    hospitalUsers: hospitalUsersWithRoles,
    handleRegister,
    handleChangeUserRole,
  } = useAuth();

  useEffect(() => {
    if (activeTab === "auth" && isHospitalAdmin) {
      handleGetHospitalUsers(user?.hospital as string);
    }
  }, [activeTab, isHospitalAdmin, user]);

  const handleChangeUserRoles = async (
    userId: string,
    newRole: string,
    hospitalId: string,
  ) => {
    setListUpdating(true);
    setUpdatingRoleId(userId);
    try {
      await handleChangeUserRole(userId, newRole, hospitalId);
      await handleGetHospitalUsers(hospitalId);
      showSuccess("Success!", "User role updated successfully.");
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to update role",
      );
    } finally {
      setListUpdating(false);
      setUpdatingRoleId(null);
    }
  };

  const getFirstCharacterAfterSpace = (name: string) => {
    const nameParts = name.split(" ");
    const character = nameParts?.map((part) => part.charAt(0));
    return character?.join("") || "";
  };

  return (
    <div className="bg-app-background w-full min-h-screen flex flex-col gap-[25px] p-4 md:p-6">
      <PatientSearchSection />

      <header className="flex flex-col items-start gap-[5px]">
        <h1 className="mt-[-1.00px] leading-[19px] font-medium text-black text-[28px] sm:text-[40px] leading-[32px] sm:leading-[44px] [font-family:'Archivo',Helvetica] tracking-[0]">
          Settings
        </h1>
        <p className="opacity-90 font-title-3l leading-[20px] mt-[5px] font-[number:var(--title-3l-font-weight)] text-black text-[length:var(--title-3l-font-size)] tracking-[var(--title-3l-letter-spacing)] leading-[var(--title-3l-line-height)] [font-style:var(--title-3l-font-style)] max-w-prose">
          {canManageHospitalIntegrations
            ? "Manage hospital details, integrations, and notification settings."
            : "Manage your profile and account preferences."}
        </p>
      </header>

      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(v) => v && setActiveTab(v)}
        className="inline-flex flex-wrap items-center gap-2 p-[3px] bg-white rounded-[100px] border border-[#dedee1] w-fit"
      >
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <ToggleGroupItem
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center justify-center gap-2 px-5 py-[10px] rounded-[100px] font-title-4r text-[length:var(--title-4r-font-size)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(activeTab === "personal" ||
          activeTab === "hospital" ||
          activeTab === "auth") && (
          <div
            className={
              activeTab === "auth"
                ? "lg:col-span-3 flex flex-col gap-6"
                : canManageHospitalIntegrations
                  ? "lg:col-span-2 flex flex-col gap-6"
                  : "lg:col-span-3 flex flex-col gap-6"
            }
          >
            {activeTab === "personal" && (
              <div className="bg-white rounded-[10px] p-[25px] flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                    Personal Information
                  </h3>
                </div>

                <div className="flex flex-col gap-[10px] mt-[5px]">
                  <div className="flex flex-col gap-[10px]">
                    <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-[60px] h-[60px] rounded-full bg-grey-light flex items-center justify-center">
                        <span className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)]">
                          {getFirstCharacterAfterSpace(formData.fullName)}
                        </span>
                      </div>
                      {/* <Button
                        variant="outline"
                        className="inline-flex items-center gap-2 px-4 py-2 h-[38px] border border-[#dedee1] rounded-[10px] bg-white hover:bg-grey-light"
                      >
                        <UploadIcon className="w-4 h-4" />
                        <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)]">
                          Upload Picture
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-red-500 hover:bg-red-50 bg-[#FFF1F1]"
                      >
                        <Trash2Icon className="w-5 h-5" />
                      </Button> */}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                        Full Name
                      </label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-1 rounded-[10px] border border-[#dedee1] bg-grey-light/30">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                        Password
                      </span>
                      <span className="font-title-5r text-x-70 text-sm">
                        Change your password in a separate step.
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setChangePasswordOpen(true)}
                      className="h-[44px] px-5 rounded-[10px] border-[#dedee1] bg-white hover:bg-grey-light shrink-0"
                    >
                      Change password
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                        Phone
                      </label>
                      <div className="flex gap-2.5">
                        <Select
                          value={formData.countryCode}
                          onValueChange={(value) =>
                            setFormData({ ...formData, countryCode: value })
                          }
                        >
                          <SelectTrigger className="w-[100px] h-[44px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px]">
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
                          className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => void handleSavePersonal()}
                      disabled={personalSaveLoading}
                      className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px]"
                    >
                      {personalSaveLoading ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "auth" && isHospitalAdmin && (
              <div className="flex flex-col gap-6">
                {/* Add new user */}
                <div className="bg-white rounded-[10px] p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5" />
                    <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                      Add new user
                    </h3>
                  </div>
                  <p className="font-title-5l text-[#57575f] text-sm">
                    Create a new user account for your hospital.
                  </p>
                  <form
                    onSubmit={handleAddUser}
                    className="flex flex-col gap-4 max-w-md"
                  >
                    {addUserSuccess && (
                      <p className="font-title-4r text-primary-2 text-sm">
                        User created successfully.
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                        Full name
                      </label>
                      <Input
                        value={newUserForm.name}
                        onChange={(e) =>
                          setNewUserForm({
                            ...newUserForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="John Doe"
                        className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) =>
                          setNewUserForm({
                            ...newUserForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="user@hospital.com"
                        className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                        Password
                      </label>
                      <Input
                        type="password"
                        value={newUserForm.password}
                        onChange={(e) =>
                          setNewUserForm({
                            ...newUserForm,
                            password: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m text-black text-[length:var(--title-4m-font-size)]">
                        Confirm password
                      </label>
                      <Input
                        type="password"
                        value={newUserForm.confirmPassword}
                        onChange={(e) =>
                          setNewUserForm({
                            ...newUserForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={addUserLoading}
                      className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px] w-fit"
                    >
                      {addUserLoading ? "Creating…" : "Add user"}
                    </Button>
                  </form>
                </div>

                {/* Hospital users list + role assign */}
                <div className="bg-white rounded-[10px] p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                      Hospital users
                    </h3>
                  </div>
                  <p className="font-title-5l text-[#57575f] text-sm">
                    View and assign roles to users in your hospital.
                  </p>
                  {usersLoading && hospitalUsersWithRoles?.length === 0 ? (
                    <p className="font-title-4r text-[#57575f] py-4">
                      Loading users…
                    </p>
                  ) : hospitalUsersWithRoles?.length === 0 ? (
                    <p className="font-title-4r text-[#57575f] py-4">
                      No users found. Add a user above.
                    </p>
                  ) : (
                    <div className="relative overflow-x-auto rounded-[10px] border border-[#dedee1]">
                      {listUpdating && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-white/80">
                          <p className="font-title-4r text-primary-2">
                            Updating role…
                          </p>
                        </div>
                      )}
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#dedee1] bg-grey-light/50">
                            <th className="text-left font-title-4m text-black px-4 py-3">
                              Name
                            </th>
                            <th className="text-left font-title-4m text-black px-4 py-3">
                              Email
                            </th>
                            <th className="text-left font-title-4m text-black px-4 py-3">
                              Role
                            </th>
                            <th className="text-left font-title-4m text-black px-4 py-3 w-[180px]">
                              Assign role
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {hospitalUsersWithRoles?.map((u) => (
                            <tr
                              key={u._id}
                              className="border-b border-[#dedee1] last:border-0"
                            >
                              <td className="px-4 py-3 font-title-4r text-black">
                                {u.name}
                              </td>
                              <td className="px-4 py-3 font-title-4r text-[#57575f]">
                                {u.email}
                              </td>
                              <td className="px-4 py-3 font-title-4r text-[#57575f] capitalize">
                                {u.role.replace(/_/g, " ")}
                              </td>
                              <td className="px-4 py-3">
                                <Select
                                  value={u.role}
                                  onValueChange={(value) => {
                                    // handleRoleChange(u._id, value);
                                    const isAllow = confirm(
                                      "Are you sure you want to change the role of this user?",
                                    );
                                    if (isAllow) {
                                      console.log("Changing user role:", {
                                        userId: u._id,
                                        newRole: value,
                                        hospitalId: u?.hospital as string,
                                      });
                                      handleChangeUserRoles(
                                        u._id,
                                        value,
                                        u?.hospital as string,
                                      );
                                    }
                                  }}
                                  disabled={updatingRoleId === u._id}
                                >
                                  <SelectTrigger className="h-9 w-full min-w-[140px] border border-[#dedee1] rounded-[6px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="doctor">
                                      Doctor
                                    </SelectItem>
                                    <SelectItem value="receptionist">
                                      Receptionist
                                    </SelectItem>
                                    <SelectItem value="nurse">Nurse</SelectItem>
                                    <SelectItem value="lab technician">
                                      Lab Technician
                                    </SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="hospital_admin">
                                      Hospital Admin
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "hospital" && (
              <div className="bg-white rounded-[10px] p-6 flex flex-col gap-[25px]">
                <div className="flex items-center gap-2">
                  <BuildingIcon className="w-5 h-5" />
                  <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                    Hospital Information
                  </h3>
                </div>

                {!user?.hospital ? (
                  <p className="text-x-70 font-title-4r">
                    You are not linked to a hospital. Contact your admin to get
                    access.
                  </p>
                ) : currentHospitalLoading && !currentHospital ? (
                  <p className="text-x-70 font-title-4r">Loading hospital…</p>
                ) : (
                  <>
                    {(currentHospitalError || hospitalSaveError) && (
                      <p className="text-red-600 font-title-4r">
                        {currentHospitalError ?? hospitalSaveError}
                      </p>
                    )}
                    <div className="flex flex-col gap-[20px]">
                      <div className="flex flex-col gap-2">
                        <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                          Hospital Logo
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="w-[60px] h-[60px] rounded-full bg-grey-light flex items-center justify-center">
                            <span className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)]">
                              {formData.hospitalName
                                ?.slice(0, 2)
                                .toUpperCase() ?? "—"}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            className="inline-flex items-center gap-2 px-4 py-2 h-[38px] border border-[#dedee1] rounded-[10px] bg-white hover:bg-grey-light"
                          >
                            <UploadIcon className="w-4 h-4" />
                            <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)]">
                              Upload Picture
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 text-red-500 hover:bg-red-50 bg-[#FFF1F1]"
                          >
                            <Trash2Icon className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            Hospital Name
                          </label>
                          <Input
                            value={formData.hospitalName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                hospitalName: e.target.value,
                              })
                            }
                            className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            Address
                          </label>
                          <Input
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                            className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            Hospital ID
                          </label>
                          <Input
                            value={formData.hospitalId}
                            readOnly
                            disabled
                            className="h-[44px] px-4 py-2 bg-grey-light border border-[#dedee1] rounded-[10px] text-x-70"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            City
                          </label>
                          <Input
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                            className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            Pincode
                          </label>
                          <Input
                            value={formData.pincode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pincode: e.target.value,
                              })
                            }
                            className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                          />
                        </div>

                        <div className="flex flex-col gap-[15px]">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            Working Hours
                          </label>
                          <div className="relative">
                            <Input
                              value={formData.workingHours}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  workingHours: e.target.value,
                                })
                              }
                              className="h-[44px] px-4 py-2 pr-12 bg-white border border-[#dedee1] rounded-[10px]"
                            />
                            <ClockIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-x-70" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            Phone Routing Number
                          </label>
                          <div className="flex gap-2.5">
                            <Select
                              value={formData.phoneRoutingCountryCode}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  phoneRoutingCountryCode: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-[100px] h-[44px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px]">
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
                              value={formData.phoneRouting}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phoneRouting: e.target.value,
                                })
                              }
                              className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-[10px]">
                          <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            WhatsApp Number
                          </label>
                          <div className="flex gap-2.5">
                            <Select
                              value={formData.whatsappCountryCode}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  whatsappCountryCode: value,
                                })
                              }
                            >
                              <SelectTrigger className="w-[100px] h-[44px] px-3 py-2 bg-white border border-[#dedee1] rounded-[10px]">
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
                              value={formData.whatsappNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  whatsappNumber: e.target.value,
                                })
                              }
                              className="flex-1 h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                          Official Email
                        </label>
                        <Input
                          type="email"
                          value={formData.officialEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              officialEmail: e.target.value,
                            })
                          }
                          className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSaveHospital}
                          disabled={
                            hospitalSaveLoading || currentHospitalLoading
                          }
                          className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px]"
                        >
                          {hospitalSaveLoading ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab !== "auth" && canManageHospitalIntegrations && (
          <div
            className={
              activeTab === "integrations"
                ? "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6"
                : "lg:col-span-1 flex flex-col gap-6"
            }
          >
            {activeTab === "integrations" && (
              <div className="bg-white rounded-[10px] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className="w-5 h-5 shrink-0 text-[#25D366]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.98a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                      WhatsApp Integration
                    </h3>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrations.whatsapp}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        whatsapp: e.target.checked,
                      })
                    }
                    className="w-11 h-6 rounded-full cursor-pointer shrink-0"
                  />
                </div>
                <p className="font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                  Connect your WhatsApp Business Account to enable automated
                  patient communication, prescription sharing, and follow-up
                  reminders.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {whatsappCredsLoading ? (
                      <p className="font-title-5r font-[number:var(--title-5r-font-weight)] text-x-70 text-[length:var(--title-5r-font-size)] tracking-[var(--title-5r-letter-spacing)] leading-[var(--title-5r-line-height)] [font-style:var(--title-5r-font-style)]">
                        Checking WhatsApp connection…
                      </p>
                    ) : whatsappCredsLinked && whatsappOnboardingComplete ? (
                      <p className="font-title-4r font-[number:var(--title-4r-font-weight)] text-[#00955C] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                        WhatsApp connected — all Graph onboarding steps finished
                        successfully.
                      </p>
                    ) : whatsappCredsLinked ? (
                      <Button
                        type="button"
                        onClick={() => void handleWhatsappStartOnboarding()}
                        disabled={whatsappOnboardingRunning}
                        className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px] w-fit font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] text-white disabled:opacity-60"
                      >
                        {whatsappOnboardingRunning
                          ? "Onboarding…"
                          : "Start onboarding"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={handleWhatsAppConnect}
                          disabled={!integrations.whatsapp}
                          className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px] w-fit font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] text-white"
                        >
                          Connect WhatsApp
                        </Button>
                        {!integrations.whatsapp && (
                          <p className="font-title-5r font-[number:var(--title-5r-font-weight)] text-x-70 text-[length:var(--title-5r-font-size)] tracking-[var(--title-5r-letter-spacing)] leading-[var(--title-5r-line-height)] [font-style:var(--title-5r-font-style)]">
                            Turn on the integration above to connect.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {whatsappCredsLinked && !whatsappOnboardingComplete && (
                    <ol className="flex flex-col gap-2 pl-0 list-none border border-[#dedee1] rounded-[10px] p-4 bg-grey-light/30">
                      {whatsappOnboardingSteps.map((step) => (
                        <li
                          key={step.id}
                          className="flex items-start gap-3 font-title-5r text-[length:var(--title-5r-font-size)] text-black"
                        >
                          <span className="shrink-0 mt-0.5" aria-hidden>
                            {step.status === "running" && (
                              <Loader2 className="w-5 h-5 text-primary-2 animate-spin" />
                            )}
                            {step.status === "success" && (
                              <CheckCircle2
                                className="w-5 h-5 text-[#00955C]"
                                aria-hidden
                              />
                            )}
                            {step.status === "failed" && (
                              <XCircle
                                className="w-5 h-5 text-[#dc2626]"
                                aria-hidden
                              />
                            )}
                            {step.status === "idle" && (
                              <Circle className="w-5 h-5 text-x-70" aria-hidden />
                            )}
                          </span>
                          <span className="flex flex-col gap-0.5 min-w-0">
                            <span>{step.label}</span>
                            {step.status === "failed" && step.errorMessage && (
                              <span className="text-[#dc2626] text-xs break-words">
                                {step.errorMessage}
                              </span>
                            )}
                            {step.httpStatus != null && (
                              <span className="text-x-70 text-xs">
                                HTTP {step.httpStatus}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[10px] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.79 6 8 7.79 8 10H10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 12 11 11.75 11 15H13C13 12.75 16 12.5 16 10C16 7.79 14.21 6 12 6ZM11 16V18H13V16H11Z"
                    fill="currentColor"
                  />
                </svg>
                <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                  Notification Control
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                      New Appointment Booked
                    </span>
                    <input
                      type="checkbox"
                      checked={notifications.newAppointment}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          newAppointment: e.target.checked,
                        })
                      }
                      className="w-11 h-6 rounded-full cursor-pointer"
                    />
                  </div>
                  <p className="font-title-5r font-[number:var(--title-5r-font-weight)] text-x-70 text-[length:var(--title-5r-font-size)] tracking-[var(--title-5r-letter-spacing)] leading-[var(--title-5r-line-height)] [font-style:var(--title-5r-font-style)]">
                    When a new patient books a slot.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                      Appointment Reminder
                    </span>
                    <input
                      type="checkbox"
                      checked={notifications.appointmentReminder}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          appointmentReminder: e.target.checked,
                        })
                      }
                      className="w-11 h-6 rounded-full cursor-pointer"
                    />
                  </div>
                  <p className="font-title-5r font-[number:var(--title-5r-font-weight)] text-x-70 text-[length:var(--title-5r-font-size)] tracking-[var(--title-5r-letter-spacing)] leading-[var(--title-5r-line-height)] [font-style:var(--title-5r-font-style)]">
                    Before scheduled time (e.g., 30 min prior).
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                      Appointment Rescheduled / Canceled
                    </span>
                    <input
                      type="checkbox"
                      checked={notifications.appointmentRescheduled}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          appointmentRescheduled: e.target.checked,
                        })
                      }
                      className="w-11 h-6 rounded-full cursor-pointer"
                    />
                  </div>
                  <p className="font-title-5r font-[number:var(--title-5r-font-weight)] text-x-70 text-[length:var(--title-5r-font-size)] tracking-[var(--title-5r-letter-spacing)] leading-[var(--title-5r-line-height)] [font-style:var(--title-5r-font-style)]">
                    Patient change alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast preview: three buttons at bottom to show custom toasts */}
        {/* <div className="mt-8 pt-6 border-t border-[#dedee1]">
          <p className="font-title-4m text-black text-[length:var(--title-4m-font-size)] mb-3">
            Toast preview
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() =>
                showSuccess(
                  "Success!",
                  "Your changes have been saved successfully.",
                )
              }
              className="bg-[#00955C] hover:bg-[#00804d] text-white rounded-[10px] px-5 py-2"
            >
              Show Success Toast
            </Button>
            <Button
              type="button"
              onClick={() =>
                showError(
                  "Error",
                  "Something went wrong. Please try again later.",
                )
              }
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-[10px] px-5 py-2"
            >
              Show Error Toast
            </Button>
            <Button
              type="button"
              onClick={() =>
                showWarning(
                  "Warning",
                  "Please review the details before proceeding.",
                )
              }
              className="bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-[10px] px-5 py-2"
            >
              Show Warning Toast
            </Button>
          </div>
        </div> */}
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};
