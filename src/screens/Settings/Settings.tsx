import React, { useState } from "react";
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
import {
  UserIcon,
  BuildingIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

export const Settings = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "Patric Peters",
    phone: "569 334 3366",
    countryCode: "+91",
    password: "••••••••",
    email: "peterpatric@gmail.com",
    hospitalName: "Central Medical Hospital",
    address: "Physical location123 Baker Street, India",
    hospitalId: "HSP-1005",
    workingHours: "8:00 AM - 9:00 PM",
    phoneRouting: "569 334 3366",
    phoneRoutingCountryCode: "+91",
    whatsappNumber: "9876 543 210",
    whatsappCountryCode: "+91",
    officialEmail: "peterpatric@gmail.com",
  });

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

  const handleSaveHospital = () => {
    console.log("Saving hospital information:", formData);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
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
                      PP
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
                        setFormData({ ...formData, password: e.target.value })
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

          <div className="bg-white rounded-[10px] p-6 flex flex-col gap-[25px]">
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5" />
              <h3 className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)] tracking-[var(--title-3m-letter-spacing)] leading-[var(--title-3m-line-height)] [font-style:var(--title-3m-font-style)]">
                Hospital Information
              </h3>
            </div>

            <div className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-2">
                <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                  Hospital Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-[60px] h-[60px] rounded-full bg-grey-light flex items-center justify-center">
                    <span className="font-title-3m font-[number:var(--title-3m-font-weight)] text-black text-[length:var(--title-3m-font-size)]">
                      CMH
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
                      setFormData({ ...formData, hospitalName: e.target.value })
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
                      setFormData({ ...formData, address: e.target.value })
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
                    onChange={(e) =>
                      setFormData({ ...formData, hospitalId: e.target.value })
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

                <div className="flex flex-col gap-[25px]">
                  <label className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    WhatsApp Number
                  </label>
                  <div className="flex gap-2.5">
                    <Select
                      value={formData.whatsappCountryCode}
                      onValueChange={(value) =>
                        setFormData({ ...formData, whatsappCountryCode: value })
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
                    setFormData({ ...formData, officialEmail: e.target.value })
                  }
                  className="h-[44px] px-4 py-2 bg-white border border-[#dedee1] rounded-[10px]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveHospital}
                  className="px-6 py-2 bg-primary-2 hover:bg-primary-2/90 rounded-[10px] h-[44px]"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
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
              Connect your WhatsApp Business Account to enable automated patient
              communication, prescription sharing, and follow-up reminders.
            </p>
          </div>

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
      </div>
    </div>
  );
};
