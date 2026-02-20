import {
  FilterIcon,
  MoreVerticalIcon,
  PhoneIcon,
  SearchIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../../components/ui/toggle-group";
import { ListError } from "../../../../components/ui/list-error";
import { LoadingSpinner } from "../../../../components/ui/loading-spinner";
import { PatientData } from "../../../../components/modals/AddPatientModal";
import { usePatient } from "../../../../contexts/PatientProvider";

const filterTabIds = ["all", "today", "tomorrow"] as const;
type PatientFilterTab = (typeof filterTabIds)[number];

function getFilterTabLabel(id: PatientFilterTab, counts: { all: number; today: number; tomorrow: number }): string {
  switch (id) {
    case "all":
      return `All (${counts.all})`;
    case "today":
      return `Today (${counts.today})`;
    case "tomorrow":
      return `Tomorrow (${counts.tomorrow})`;
    default:
      return id;
  }
}

const patientsData = [
  {
    name: "Olivia Turner",
    age: "28 years old",
    phone: "+91 3456728902",
    gender: "Female",
    genderIcon: "/female.svg",
    reason: "Dizziness or weakness",
    doctor: "Dr. Olivia Turner",
    status: "Completed",
    statusColor: "bg-[#dffff2] text-[#00955b]",
    date: "8 Nov 2025",
    time: "11:30 AM",
  },
  {
    name: "Ethan Miller",
    age: "18 years old",
    phone: "+91 3456728902",
    gender: "Male",
    genderIcon: "/male.svg",
    reason: "Routine health check-up",
    doctor: "Dr. Sophia Adams",
    status: "Today",
    statusColor: "bg-[#d5eaff] text-[#007cff]",
    date: "8 Nov 2025",
    time: "12:30 AM",
  },
  {
    name: "Sophia Adams",
    age: "10 years old",
    phone: "+91 3456728902",
    gender: "Female",
    genderIcon: "/female.svg",
    reason: "Fever or flu symptoms",
    doctor: "Dr. Emily Cooper",
    status: "Upcoming",
    statusColor: "bg-[#fff1e0] text-[#ff9000]",
    date: "9 Nov 2025",
    time: "1:30 AM",
  },
  {
    name: "Liam Brooks",
    age: "32 years old",
    phone: "+91 3456728902",
    gender: "Male",
    genderIcon: "/male.svg",
    reason: "Cough and cold",
    doctor: "Dr. Ethan Miller",
    status: "Cancelled",
    statusColor: "bg-[#ffe9e9] text-[#ff0004]",
    date: "9 Nov 2025",
    time: "2:00 AM",
  },
  {
    name: "Ava Johnson",
    age: "36 years old",
    phone: "+91 3456728902",
    gender: "Female",
    genderIcon: "/female.svg",
    reason: "Body pain or fatigue",
    doctor: "Dr. Olivia Turner",
    status: "Upcoming",
    statusColor: "bg-[#fff1e0] text-[#ff9000]",
    date: "12 Nov 2025",
    time: "3:00 AM",
  },
  {
    name: "Noah Carter",
    age: "65 years old",
    phone: "+91 3456728902",
    gender: "Male",
    genderIcon: "/male.svg",
    reason: "Diabetes management",
    doctor: "Dr. Daniel Reed",
    status: "Upcoming",
    statusColor: "bg-[#fff1e0] text-[#ff9000]",
    date: "13 Nov 2025",
    time: "3:30 AM",
  },
  {
    name: "Grace Mitchell",
    age: "35 years old",
    phone: "+91 3456728902",
    gender: "Female",
    genderIcon: "/female.svg",
    reason: "Stomach ache or digestion issues",
    doctor: "Dr. Ava Johnson",
    status: "Completed",
    statusColor: "bg-[#dffff2] text-[#00955b]",
    date: "17 Nov 2025",
    time: "4:30 AM",
  },
  {
    name: "James Parker",
    age: "22 years old",
    phone: "+91 3456728902",
    gender: "Male",
    genderIcon: "/male.svg",
    reason: "Dizziness or weakness",
    doctor: "Dr. Grace Mitchell",
    status: "Cancelled",
    statusColor: "bg-[#ffe9e9] text-[#ff0004]",
    date: "20 Nov 2025",
    time: "5:30 AM",
  },
];

interface PatientListSectionProps {
  onEditPatient: (patient: PatientData & { _id?: string }) => void;
  onDeletePatient: (patient: PatientData & { _id?: string }) => void;
}

export const PatientListSection = ({
  onEditPatient,
  onDeletePatient,
}: PatientListSectionProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<PatientFilterTab>("all");
  const {
    patients,
    searchedPatients,
    searchQuery,
    setSearchQuery,
    handlePatient,
    handleSearchPatients,
    resetSearchedPatients,
    loading,
    error,
    counts,
    limit,
  } = usePatient();

  const listToShow =
    searchQuery.trim() === ""
      ? patients
      : searchedPatients;

  useEffect(() => {
    handlePatient(1, limit, activeTab);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchPatients(searchQuery);
      } else {
        resetSearchedPatients();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (value: string) => {
    if (filterTabIds.includes(value as PatientFilterTab)) {
      setActiveTab(value as PatientFilterTab);
    }
  };

  const showLoading = loading;
  const showError = error && !loading;

  if (showLoading) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
        <LoadingSpinner />
      </section>
    );
  }
  if (showError) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
        <ListError message={error} />
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <ToggleGroup
          type="single"
          value={activeTab}
          onValueChange={handleTabChange}
          className="inline-flex items-center gap-[15px] p-[3px] bg-grey-light rounded-[100px]"
        >
          {filterTabIds.map((id) => (
            <ToggleGroupItem
              key={id}
              value={id}
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              {getFilterTabLabel(id, counts)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-[15px]">
          <div className="flex w-full lg:w-[372px] items-center gap-2.5 px-[8px] py-[6px] bg-grey-light rounded-[100px] h-[36px]">
            <SearchIcon className="w-[24px] h-[24px] text-black opacity-70" />
            <Input
              placeholder="Search by patient name, ID, or visit reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent opacity-70 text-[14px] leading-[19px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <Select>
            <SelectTrigger className="flex w-[107px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                className="text-[14px] leading-[19px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                value="all"
              >
                All
              </SelectItem>
              <SelectItem
                className="text-[14px] leading-[19px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                value="completed"
              >
                Completed
              </SelectItem>
              <SelectItem
                className="text-[14px] leading-[19px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                value="today"
              >
                Today
              </SelectItem>
              <SelectItem
                className="text-[14px] leading-[19px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                value="upcoming"
              >
                Upcoming
              </SelectItem>
              <SelectItem
                className="text-[14px] leading-[19px] font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]"
                value="cancelled"
              >
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-grey-light rounded-[100px] hover:bg-grey-light"
          >
            <FilterIcon className="w-6 h-6" />
            <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              Filter
            </span>
          </Button>

          {/* <div className="inline-flex items-center p-[2px] bg-grey-light rounded-[100px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white"
            >
              <img alt="List view" src="/frame-2147229233.svg" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white"
            >
              <img alt="Grid view" src="/frame-2147229236.svg" />
            </Button>
          </div> */}
        </div>
      </div>

      <div className="flex flex-col overflow-x-auto -mx-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Patient Name
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Phone Number
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Gender
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Reason
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Doctor Assigned
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Status
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Appointment Date and Time
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listToShow.map((patient, index) => (
              <TableRow
                key={index}
                className="border-b border-[#dedee1] hover:bg-grey-light/50"
              >
                <TableCell className="p-[0px]">
                  <div className="flex flex-col px-[20px] py-[15px]">
                    <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                      {patient.fullName}
                    </span>
                    <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                      {patient.age}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="inline-flex items-center gap-[5px] px-[20px] py-[15px]">
                    <PhoneIcon className="w-4 h-4" />
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {patient.phoneNumber}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="inline-flex items-center gap-2.5 px-[20px] py-[15px]">
                    <img
                      className="w-4 h-4"
                      alt={patient.gender}
                      src={
                        patient.gender === "Male" ? "/male.svg" : "/female.svg"
                      }
                    />
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {patient.gender}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[15px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {patient.reason || "No reason provided"}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <span className="font-title-4l px-[20px] py-[15px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                    {/* {patient.doctor || "No doctor assigned"} */}
                    {patient?.appointments?.length &&
                    patient?.appointments?.length > 0
                      ? patient?.appointments[0]?.doctor?.fullName ||
                        "No doctor assigned"
                      : "No doctor assigned"}
                  </span>
                </TableCell>
                <TableCell className="p-[0px]">
                  <Badge
                    className={`${
                      patient?.appointments?.length &&
                      patient?.appointments?.length > 0
                        ? patient?.appointments[0]?.status === "Completed"
                          ? "bg-[#dffff2] text-[#00955b]"
                          : patient?.appointments[0]?.status === "Cancelled"
                            ? "bg-[#ffe9e9] text-[#ff0004]"
                            : patient?.appointments[0]?.status === "Upcoming"
                              ? "bg-[#fff1e0] text-[#ff9000]"
                              : "bg-[#fff1e0] text-[#ff9000]"
                        : "bg-[#fff1e0] text-[#ff9000]"
                    } rounded-[100px] px-[10px] py-[5px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] hover:${
                      patient?.appointments?.length &&
                      patient?.appointments?.length > 0
                        ? patient?.appointments[0]?.status === "Completed"
                          ? "bg-[#dffff2] text-[#00955b]"
                          : patient?.appointments[0]?.status === "Cancelled"
                            ? "bg-[#ffe9e9] text-[#ff0004]"
                            : patient?.appointments[0]?.status === "Upcoming"
                              ? "bg-[#fff1e0] text-[#ff9000]"
                              : "bg-[#fff1e0] text-[#ff9000]"
                        : "bg-[#fff1e0] text-[#ff9000]"
                    }`}
                  >
                    {/* {patient.status || "Upcoming"} */}
                    {patient?.appointments?.length &&
                    patient?.appointments?.length > 0
                      ? patient?.appointments[0]?.status || "Upcoming"
                      : "Upcoming"}
                  </Badge>
                </TableCell>
                <TableCell className="p-[0px]">
                  <div className="flex flex-col gap-[3px] px-[20px] py-[15px]">
                    <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                      {patient.appointments?.length &&
                      patient.appointments?.length > 0
                        ? new Date(
                            patient.appointments[0]?.appointmentDateTime,
                          ).toLocaleDateString() ||
                          "No appointment date and time"
                        : "No appointment date and time"}
                    </span>
                    <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                      {patient.appointments?.length &&
                      patient.appointments?.length > 0
                        ? new Date(
                            patient.appointments[0]?.appointmentDateTime,
                          ).toLocaleTimeString() ||
                          "No appointment date and time"
                        : "No appointment date and time"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVerticalIcon className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onEditPatient({
                            name: patient.fullName,
                            age: patient.age,
                            phone: patient.phoneNumber,
                            gender: patient.gender,
                            reason: patient.reason || "",
                            countryCode: "+91",
                            _id: patient?._id || "",
                          })
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onDeletePatient({
                            name: patient.fullName,
                            age: patient.age,
                            phone: patient.phoneNumber,
                            gender: patient.gender,
                            reason: "No reason provided",
                            countryCode: "+91",
                            _id: patient?._id || "",
                          })
                        }
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
