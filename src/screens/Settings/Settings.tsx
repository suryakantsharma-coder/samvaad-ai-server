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
  EyeIcon,
  EyeOffIcon,
  Trash2Icon,
  UploadIcon,
  BellIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthProvider";
import { useHospital } from "../../contexts/HospitalProvider";
import { showSuccess, showError, showWarning } from "../../lib/toast";
import {
  createUserAsAdmin,
  getHospitalUsers,
  updateUserRole,
} from "../../data/auth";
import type { User } from "../../types/auth.type";

const BASE_SETTINGS_TABS = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "hospital", label: "Hospital", icon: BuildingIcon },
  { id: "integrations", label: "Integrations & Notifications", icon: BellIcon },
] as const;

export const Settings = (): JSX.Element => {
  const { user } = useAuth();
  const {
    currentHospital,
    currentHospitalLoading,
    currentHospitalError,
    fetchHospitalById,
    updateHospitalById,
  } = useHospital();
  const isHospitalAdmin = user?.role === "hospital_admin";

  const settingsTabs = useMemo(() => {
    const tabs: Array<{ id: string; label: string; icon: typeof UserIcon }> = [
      ...BASE_SETTINGS_TABS,
    ];
    if (isHospitalAdmin) {
      tabs.push({ id: "auth", label: "Auth", icon: ShieldCheckIcon });
    }
    return tabs;
  }, [isHospitalAdmin]);

  const [activeTab, setActiveTab] = useState<string>("personal");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isHospitalAdmin && activeTab === "auth") {
      setActiveTab("personal");
    }
  }, [isHospitalAdmin, activeTab]);

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
    password: "••••••••",
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
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name ?? prev.fullName,
        email: user.email ?? prev.email,
      }));
    }
  }, [user?.name, user?.email]);

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

  const [integrations, setIntegrations] = useState({
    whatsapp: true,
  });

  const [notifications, setNotifications] = useState({
    newAppointment: true,
    appointmentReminder: true,
    appointmentRescheduled: true,
  });

  const handleSavePersonal = () => {
    console.log("Saving personal information:", formData);
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
          Manage hospital details, integrations, and AI automation settings.
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
                : "lg:col-span-2 flex flex-col gap-6"
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

                    <div className="flex flex-col gap-2">
                      <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="h-[44px] px-4 py-2 pr-12 bg-white border border-[#dedee1] rounded-[10px]"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 hover:bg-transparent"
                        >
                          {showPassword ? (
                            <EyeOffIcon className="w-5 h-5 text-x-70" />
                          ) : (
                            <EyeIcon className="w-5 h-5 text-x-70" />
                          )}
                        </Button>
                      </div>
                    </div>
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
                      onClick={handleSavePersonal}
                      className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px]"
                    >
                      Save
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

        {activeTab !== "auth" && (
          <div
            className={
              activeTab === "integrations"
                ? "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6"
                : "lg:col-span-1 flex flex-col gap-6"
            }
          >
            {(activeTab === "integrations" ||
              activeTab === "personal" ||
              activeTab === "hospital") && (
              <div className="bg-white rounded-[10px] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                    WhatsApp Integration
                  </h3>
                  <input
                    type="checkbox"
                    checked={integrations.whatsapp}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        whatsapp: e.target.checked,
                      })
                    }
                    className="w-11 h-6 rounded-full cursor-pointer"
                  />
                </div>
                <p className="font-title-4r font-[number:var(--title-4r-font-weight)] text-x-70 text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
                  Connect your WhatsApp Business Account to enable automated
                  patient communication, prescription sharing, and follow-up
                  reminders.
                </p>
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
    </div>
  );
};
