import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Filter as FilterIcon,
  MoveVertical as MoreVerticalIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Video as VideoIcon,
  MoreVertical as ThreeDotsVerticalIcon,
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
import { useAppointments } from "../../../../contexts/AppointmentProvider";
import { Appointments } from "../../../../types/appointment.type";
import { useDoctor } from "../../../../contexts/DoctorProvider";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "today", label: "Today (4)" },
  { id: "upcoming", label: "Upcoming (15)" },
  { id: "completed", label: "Completed (670)" },
  { id: "cancelled", label: "Cancelled (110)" },
];

const todayAppointments = [
  {
    patientName: "Olivia Turner",
    phone: "+91 3456728902",
    reason: "Dizziness or weakness",
    doctorAssigned: "Dr. Sophia Adams",
    status: "Today",
    statusColor: "bg-[#d5eaff] text-[#007cff]",
    type: "Hospital",
    appointmentDate: "4 Nov 2025",
    appointmentTime: "11:30 AM",
  },
  {
    patientName: "Ethan Miller",
    phone: "+91 3456728902",
    reason: "Routine health check-up",
    doctorAssigned: "Dr. Liam Brooks",
    status: "Today",
    statusColor: "bg-[#d5eaff] text-[#007cff]",
    type: "Zoom",
    appointmentDate: "8 Nov 2025",
    appointmentTime: "11:30 AM",
  },
  {
    patientName: "Sophia Adams",
    phone: "+91 3456728902",
    reason: "Fever or flu symptoms",
    doctorAssigned: "Dr. Emily Cooper",
    status: "Today",
    statusColor: "bg-[#d5eaff] text-[#007cff]",
    type: "Hospital",
    appointmentDate: "8 Nov 2025",
    appointmentTime: "11:30 AM",
  },
];

const scheduledAppointments = [
  {
    patientName: "Olivia Turner",
    dateCreated: "4 Nov 2025",
    medicines: 4,
    duration: "7 days",
    status: "Active",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "Ethan Miller",
    dateCreated: "4 Nov 2025",
    medicines: 2,
    duration: "7 days",
    status: "Completed",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "Sophia Adams",
    dateCreated: "4 Nov 2025",
    medicines: 3,
    duration: "7 days",
    status: "Active",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "Liam Brooks",
    dateCreated: "4 Nov 2025",
    medicines: 2,
    duration: "7 days",
    status: "Completed",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "Ava Johnson",
    dateCreated: "4 Nov 2025",
    medicines: 4,
    duration: "7 days",
    status: "Completed",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "Noah Carter",
    dateCreated: "4 Nov 2025",
    medicines: 1,
    duration: "7 days",
    status: "Active",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "Grace Mitchell",
    dateCreated: "4 Nov 2025",
    medicines: 4,
    duration: "7 days",
    status: "Completed",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
  {
    patientName: "James Parker",
    dateCreated: "4 Nov 2025",
    medicines: 5,
    duration: "7 days",
    status: "Active",
    followUp: "After 5 days",
    endDate: "9 Nov 2025",
    action: "more",
  },
];

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

export const PrescriptionListSection = ({}: {
  onEditPrescription: (prescription: any) => void;
  onDeletePrescription: (prescription: any) => void;
  onMarkAsDonePrescription: (prescription: any) => void;
}): JSX.Element => {
  const [activeTab, setActiveTab] = useState("all");
  const { searchDoctorsByName } = useDoctor();

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <ToggleGroup
          type="single"
          value={activeTab}
          onValueChange={setActiveTab}
          className="inline-flex items-center gap-[15px] p-[3px] bg-grey-light rounded-[100px]"
        >
          {filterTabs.map((tab) => (
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
              placeholder="Search patient...."
              className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <Select>
            <SelectTrigger className="flex w-[107px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
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

          <Button
            variant="ghost"
            className="inline-flex items-center gap-[5px] px-2.5 py-1.5 bg-grey-light rounded-[100px] hover:bg-grey-light"
          >
            <FilterIcon className="w-6 h-6" />
            <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              Filter
            </span>
          </Button>
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
                    Medicines
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Duration
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Status
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Follow Up
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    End Date
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Action
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledAppointments.map((appointment, index: number) => (
                  <TableRow
                    key={index}
                    className="border-b border-[#dedee1] hover:bg-grey-light/50"
                  >
                    <TableCell className="p-[0px]">
                      <span className="font-title-4l px-[20px] py-[16px] text-black font-medium text-[14px] leading-[19px] font-[number:var(--title-4l-font-weight)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                        {appointment.patientName}
                      </span>
                    </TableCell>
                    <TableCell className="p-[0px]">
                      <div className="inline-flex items-center gap-[5px]">
                        <PhoneIcon className="w-4 h-4" />
                        <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {appointment.medicines}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-[0px]">
                      <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                        {appointment.duration.length > 20
                          ? appointment.duration.slice(0, 20) + "..."
                          : appointment.duration}
                      </span>
                    </TableCell>
                    <TableCell className="p-[0px]">
                      <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                        {appointment.status}
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
                        {appointment.followUp === "Hospital" ? (
                          <img
                            src="/pill.svg"
                            alt="Hospital"
                            className="w-4 h-4"
                          />
                        ) : (
                          <VideoIcon className="w-4 h-4" />
                        )}
                        <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {appointment.followUp}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-[0px]">
                      <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
                        <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {new Date(appointment.endDate).toLocaleDateString()}
                        </span>
                        <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] tracking-[var(--title-5l-letter-spacing)] leading-[var(--title-5l-line-height)] [font-style:var(--title-5l-font-style)]">
                          {new Date(appointment.endDate).toLocaleTimeString()}
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
                          <DropdownMenuItem
                          // onClick={() => onRescheduleAppointment(appointment)}
                          >
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                          // onClick={() => onMarkAsDoneAppointment(appointment)}
                          >
                            Mark as done
                          </DropdownMenuItem>
                          <DropdownMenuItem
                          // onClick={() => onCancelAppointment(appointment)}
                          >
                            Cancel appointment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
};
