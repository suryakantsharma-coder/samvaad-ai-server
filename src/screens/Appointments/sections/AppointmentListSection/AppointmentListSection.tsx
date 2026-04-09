import {
  PhoneCall as PhoneCallIcon,
  Search as SearchIcon,
  MoreVertical as ThreeDotsVerticalIcon,
} from "lucide-react";
import { AppointmentTypeIcon } from "../../../../components/appointments/AppointmentTypeIcon";
import { useEffect, useMemo, useState } from "react";
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
import { Pagination } from "../../../../components/ui/pagination";
import { useAppointments } from "../../../../contexts/AppointmentProvider";
import { formatTime12h } from "../../../../lib/dateTimeDisplay";
import { Appointments } from "../../../../types/appointment.type";

// create a status color map function
const statusColorMap = (status: string) => {
  switch (status) {
    case "Upcoming":
      return "bg-[#fff1e0] text-[#ff9000]";
    case "Completed":
      return "bg-[#dffff2] text-[#00955b]";
    case "Cancelled":
      return "bg-[#ffe9e9] text-[#ff0004]";
    default:
      return "bg-[#d5eaff] text-[#007cff]";
  }
};

function getMeetingUrl(appointment: Appointments): string | null {
  const record = appointment as Appointments & Record<string, unknown>;
  const candidates = [
    record.videoUrl,
    record.meetUrl,
    record.zoomUrl,
    record.meetingUrl,
    record.joinUrl,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

export const AppointmentListSection = ({
  onCancelAppointment,
  onRescheduleAppointment,
  onMarkAsDoneAppointment,
}: {
  onCancelAppointment: (appointment: Appointments) => void;
  onRescheduleAppointment: (appointment: Appointments) => void;
  onMarkAsDoneAppointment: (appointment: Appointments) => void;
}): JSX.Element => {
  const [activeTab, setActiveTab] = useState<"all" | "today" | "tomorrow">(
    "today",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "today" | "upcoming" | "completed" | "cancelled"
  >("upcoming");
  const [typeFilter, setTypeFilter] = useState<
    | "all"
    | "checkup"
    | "consultation"
    | "emergency"
    | "other"
    | "hospital"
    | "zoom"
    | "video_call"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    appointments,
    searchedAppointments,
    counts,
    limit,
    totalPages,
    currentPage,
    handleGetAppointments,
    handleSearchAppointments,
    resetSearchedAppointments,
    loading,
    error,
  } = useAppointments();

  // const listToShow =
  //   searchQuery.trim() === "" ? appointments : (searchedAppointments ?? []);

  const tabs = [
    { id: "all" as const, label: `All (${counts.all})` },
    { id: "today" as const, label: `Today (${counts.today})` },
    { id: "tomorrow" as const, label: `Tomorrow (${counts.tomorrow})` },
  ];

  useEffect(() => {
    // API expects status with capital first letter (e.g. "Upcoming", "Completed", "Cancelled")
    const statusForApi =
      statusFilter === "all"
        ? undefined
        : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
    const typeForApi = typeFilter === "all" ? undefined : typeFilter;
    const sortOrderForApi = activeTab === "all" ? "desc" : undefined;
    handleGetAppointments(1, limit, {
      filter: activeTab,
      sortOrder: sortOrderForApi,
      status: statusForApi,
      type: typeForApi,
    });
  }, [activeTab, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchAppointments(searchQuery);
      } else {
        resetSearchedAppointments();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (value: string) => {
    if (value === "all" || value === "today" || value === "tomorrow") {
      setActiveTab(value);
    }
  };

  // filter appointments by status

  const filteredAppointments = useMemo(() => {
    return (appointments ?? []).filter((appointment: Appointments) => {
      const statusMatch =
        statusFilter === "all" ||
        appointment.status.toLowerCase() === statusFilter.toLowerCase();
      const typeMatch =
        typeFilter === "all" ||
        appointment.type.toLowerCase() === typeFilter.toLowerCase();
      return statusMatch && typeMatch;
    });
  }, [appointments, statusFilter, typeFilter]);

  const filteredSearchedAppointments = useMemo(() => {
    return (searchedAppointments ?? []).filter((appointment: Appointments) => {
      const statusMatch =
        statusFilter === "all" ||
        appointment.status.toLowerCase() === statusFilter.toLowerCase();
      const typeMatch =
        typeFilter === "all" ||
        appointment.type.toLowerCase() === typeFilter.toLowerCase();
      return statusMatch && typeMatch;
    });
  }, [searchedAppointments, statusFilter, typeFilter]);

  const listToShow = useMemo(() => {
    if (searchQuery.trim() === "") {
      return filteredAppointments;
    }
    return filteredSearchedAppointments;
  }, [filteredAppointments, filteredSearchedAppointments, searchQuery]);

  const emptyStateMessage = useMemo(() => {
    if (activeTab === "today") return "No appointment for today";
    if (activeTab === "tomorrow") return "No appointment for tomorrow";
    return "No data found";
  }, [activeTab]);

  // During debounced search, keep table visible and avoid full-page loader flicker.
  const showLoading = loading && searchQuery.trim() === "";
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
          {tabs.map((tab) => (
            <ToggleGroupItem
              key={tab.id}
              value={tab.id}
              className="inline-flex items-center justify-center gap-[5px] px-5 py-[5px] rounded-[100px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] data-[state=on]:bg-primary-2 data-[state=on]:text-white bg-transparent text-x-70"
            >
              {tab.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-[15px]">
          <div className="flex w-full lg:w-[372px] items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px]">
            <SearchIcon className="w-6 h-6 text-black opacity-70" />
            <Input
              placeholder="Search by patient, status, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "today" ||
                value === "upcoming" ||
                value === "completed" ||
                value === "cancelled"
              ) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger className="flex w-[120px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "checkup" ||
                value === "consultation" ||
                value === "emergency" ||
                value === "other" ||
                value === "hospital" ||
                value === "zoom" ||
                value === "video_call"
              ) {
                setTypeFilter(value);
              }
            }}
          >
            <SelectTrigger className="flex w-[120px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="checkup">Checkup</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="video_call">Video Call</SelectItem>
            </SelectContent>
          </Select>

          {/* <Button
            variant="ghost"
            className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-grey-light rounded-[100px] hover:bg-grey-light"
          >
            <FilterIcon className="w-6 h-6" />
            <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              Filter
            </span>
          </Button> */}
        </div>
      </div>

      <div className="flex flex-col w-full gap-[30px]">
        <div className="flex flex-col">
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
                    Reason
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Doctor Assigned
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Status
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Type
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
                {listToShow.length === 0 ? (
                  <TableRow className="border-b border-[#dedee1]">
                    <TableCell
                      colSpan={8}
                      className="px-[20px] py-10 text-center text-x-70 font-title-4r"
                    >
                      {emptyStateMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  listToShow.map((appointment: Appointments, index: number) => (
                    <TableRow
                      key={index}
                      className="border-b border-[#dedee1] hover:bg-grey-light/50"
                    >
                      <TableCell className="p-[0px]">
                        {/* <span className="font-title-4l px-[20px] py-[16px] text-black font-medium text-[14px] leading-[19px] font-[number:var(--title-4l-font-weight)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                            {appointment.patient.fullName}
                          </span> */}
                        <div className="flex flex-col px-[20px] py-[15px]">
                          <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                            {typeof appointment.patient === "object" &&
                            appointment.patient !== null
                              ? (appointment.patient.fullName ?? "—")
                              : "—"}
                          </span>
                          <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                            {appointment.appointmentId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <div className="inline-flex items-center gap-[5px]">
                          <PhoneCallIcon className="w-4 h-4" />
                          <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                            {typeof appointment.patient === "object" &&
                            appointment.patient !== null
                              ? (appointment.patient.phoneNumber ?? "—")
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {appointment.reason}
                        </span>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {typeof appointment.doctor === "object" &&
                          appointment.doctor !== null
                            ? ((appointment.doctor as { fullName?: string })
                                .fullName ?? "—")
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-[10px] py-[16px]">
                        <Badge
                          className={`${statusColorMap(
                            appointment.status,
                          )}  rounded-[100px] px-2.5 py-[5px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] hover:${statusColorMap(
                            appointment.status,
                          )}`}
                        >
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <div className="inline-flex items-center gap-2.5 px-[20px] py-[16px]">
                          <AppointmentTypeIcon
                            type={appointment.type}
                            className="w-4 h-4 shrink-0 text-[#57575f]"
                          />
                          <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)] capitalize">
                            {appointment.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
                          <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                            {new Date(
                              appointment.appointmentDateTime,
                            ).toLocaleDateString()}
                          </span>
                          <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                            {formatTime12h(appointment.appointmentDateTime)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 px-[40px] py-[10px]"
                            >
                              <ThreeDotsVerticalIcon className="h-6 w-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(appointment.type?.toLowerCase() === "zoom" ||
                              appointment.type?.toLowerCase() === "video_call") && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const url = getMeetingUrl(appointment);
                                  if (!url) return;
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                disabled={!getMeetingUrl(appointment)}
                              >
                                Join meet
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onRescheduleAppointment(appointment)}
                            >
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onMarkAsDoneAppointment(appointment)}
                            >
                              Mark as done
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onCancelAppointment(appointment)}
                            >
                              Cancel appointment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {searchQuery.trim() === "" && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            const statusForApi =
              statusFilter === "all"
                ? undefined
                : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
            const typeForApi = typeFilter === "all" ? undefined : typeFilter;
            const sortOrderForApi = activeTab === "all" ? "desc" : undefined;
            handleGetAppointments(page, limit, {
              filter: activeTab,
              sortOrder: sortOrderForApi,
              status: statusForApi,
              type: typeForApi,
            });
          }}
          disabled={loading}
        />
      )}
    </section>
  );
};
