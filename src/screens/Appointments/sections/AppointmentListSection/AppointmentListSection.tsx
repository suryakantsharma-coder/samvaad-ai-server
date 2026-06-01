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
  TableLoadingRow,
  TableRow,
} from "../../../../components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../../components/ui/toggle-group";
import { ListError } from "../../../../components/ui/list-error";
import { Pagination } from "../../../../components/ui/pagination";
import { useAppointments } from "../../../../contexts/AppointmentProvider";
import { useAuth } from "../../../../contexts/AuthProvider";
import { formatTime12h } from "../../../../lib/dateTimeDisplay";
import {
  getDoctorAppointmentsListOptions,
  getLinkedDoctorRecordId,
  normalizeRoleKey,
} from "../../../../lib/userRole";
import type { User } from "../../../../types/auth.type";
import { Appointments } from "../../../../types/appointment.type";

function appointmentAssignedToDoctor(
  appointment: Appointments,
  doctorMongoId: string,
): boolean {
  const d = appointment.doctor;
  if (typeof d === "string" && d.trim()) return d.trim() === doctorMongoId;
  if (d && typeof d === "object" && "_id" in d) {
    return (d as { _id?: string })._id === doctorMongoId;
  }
  return false;
}

/** Client guard when API search/list returns rows without `doctor` name match. */
function appointmentMatchesDoctorUserScope(
  appointment: Appointments,
  user: User | null | undefined,
): boolean {
  if (normalizeRoleKey(user?.role) !== "doctor") return true;
  const linkedId = getLinkedDoctorRecordId(user);
  const nameFilter = user?.name?.trim();
  if (linkedId && appointmentAssignedToDoctor(appointment, linkedId))
    return true;
  if (nameFilter) {
    const needle = nameFilter.toLowerCase();
    const d = appointment.doctor;
    if (d && typeof d === "object" && "fullName" in d) {
      const fn = String(
        (d as { fullName?: string }).fullName ?? "",
      ).toLowerCase();
      if (fn.includes(needle) || needle.includes(fn)) return true;
    }
  }
  return !linkedId && !nameFilter;
}

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
    record.video_url,
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

function normalizeAppointmentType(type: string): string {
  return type.trim().toLowerCase().replace(/_/g, "-");
}

function isTeleCallerType(type: string | undefined | null): boolean {
  const t = normalizeAppointmentType(type ?? "");
  return t === "tele-caller" || t === "telecaller";
}

export const AppointmentListSection = ({
  onCancelAppointment,
  onRescheduleAppointment,
  onMarkAsDoneAppointment,
  listFromDate = "",
  listToDate = "",
}: {
  onCancelAppointment: (appointment: Appointments) => void;
  onRescheduleAppointment: (appointment: Appointments) => void;
  onMarkAsDoneAppointment: (appointment: Appointments) => void;
  /** YYYY-MM-DD → GET /api/appointments `fromDate` / `toDate`. */
  listFromDate?: string;
  listToDate?: string;
}): JSX.Element => {
  const { user } = useAuth();
  const doctorListQuery = useMemo(
    () => getDoctorAppointmentsListOptions(user),
    [user],
  );
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
    | "tele-caller"
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
    { id: "all" as const, label: `All` },
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
      fromDate: listFromDate,
      toDate: listToDate,
      ...doctorListQuery,
    });
  }, [
    activeTab,
    statusFilter,
    typeFilter,
    limit,
    listFromDate,
    listToDate,
    doctorListQuery,
  ]);

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
      if (!appointmentMatchesDoctorUserScope(appointment, user)) return false;
      const statusMatch =
        statusFilter === "all" ||
        appointment.status.toLowerCase() === statusFilter.toLowerCase();
      const typeMatch =
        typeFilter === "all" ||
        normalizeAppointmentType(appointment.type) ===
          normalizeAppointmentType(typeFilter);
      return statusMatch && typeMatch;
    });
  }, [appointments, statusFilter, typeFilter, user]);

  const filteredSearchedAppointments = useMemo(() => {
    return (searchedAppointments ?? []).filter((appointment: Appointments) => {
      if (!appointmentMatchesDoctorUserScope(appointment, user)) return false;
      const statusMatch =
        statusFilter === "all" ||
        appointment.status.toLowerCase() === statusFilter.toLowerCase();
      const typeMatch =
        typeFilter === "all" ||
        normalizeAppointmentType(appointment.type) ===
          normalizeAppointmentType(typeFilter);
      return statusMatch && typeMatch;
    });
  }, [searchedAppointments, statusFilter, typeFilter, user]);

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

        <div className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-[15px] overflow-x-auto lg:min-w-0 lg:flex-1">
          <div className="flex min-w-0 flex-1 max-w-[372px] items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px]">
            <SearchIcon className="w-6 h-6 shrink-0 text-black opacity-70" />
            <Input
              placeholder="Search by patient, status, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "upcoming" ||
                value === "completed" ||
                value === "cancelled"
              ) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger className="flex h-[38px] w-[120px] shrink-0 items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
                value === "hospital" ||
                value === "tele-caller"
              ) {
                setTypeFilter(value);
              }
            }}
          >
            <SelectTrigger className="flex h-[38px] min-w-[120px] max-w-[160px] shrink-0 items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="checkup">Checkup</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="tele-caller">Tele-caller</SelectItem>
            </SelectContent>
          </Select>
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
                  <TableHead className="text-right font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)] md:text-left">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableLoadingRow colSpan={8} />
                ) : listToShow.length === 0 ? (
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
                              className="ml-auto h-6 w-6 px-[40px] py-[10px] hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
                            >
                              <ThreeDotsVerticalIcon className="h-6 w-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(appointment.type?.toLowerCase() === "zoom" ||
                              appointment.type?.toLowerCase() ===
                                "video_call") && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const url = getMeetingUrl(appointment);
                                  if (!url) return;
                                  window.open(
                                    url,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                                disabled={!getMeetingUrl(appointment)}
                              >
                                Join meet
                              </DropdownMenuItem>
                            )}
                            {isTeleCallerType(appointment.type) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const url = getMeetingUrl(appointment);
                                  if (!url) return;
                                  window.open(
                                    url,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                                disabled={!getMeetingUrl(appointment)}
                              >
                                Join call
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                onRescheduleAppointment(appointment)
                              }
                            >
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onMarkAsDoneAppointment(appointment)
                              }
                            >
                              Mark as done
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
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
              fromDate: listFromDate,
              toDate: listToDate,
              ...doctorListQuery,
            });
          }}
          disabled={loading}
        />
      )}
    </section>
  );
};
