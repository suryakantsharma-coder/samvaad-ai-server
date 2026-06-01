import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Users, Phone, UserRound, MoreHorizontal, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DASHBOARD_PATIENT_PREVIEW_LIMIT } from "../../../../data/dashboard";
import { useDashboardData } from "../../context/DashboardDataContext";

export const PatientOverviewSection = (): JSX.Element => {
  const { response } = useDashboardData();
  const navigate = useNavigate();
  const patientData = response.patients.slice(0, DASHBOARD_PATIENT_PREVIEW_LIMIT);

  return (
    <div className="w-full flex flex-col gap-5 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
            <Users className="w-[22px] h-[22px] text-x-70" strokeWidth={1.8} />
          </div>
          <span className="font-title-3r font-[number:var(--title-3r-font-weight)] text-[length:var(--title-3r-font-size)] leading-[var(--title-3r-line-height)] text-black tracking-[var(--title-3r-letter-spacing)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
            Patient Overview
          </span>
        </div>
        <div className="inline-flex items-center gap-[5px] cursor-pointer">
          <span
            className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]"
            onClick={() => navigate("/patients")}
          >
            See all
          </span>
          <ChevronRight
            className="w-[14px] h-[14px] text-x-70"
            strokeWidth={2}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 px-4 pb-5 md:hidden">
        {patientData.map((patient) => (
          <div
            key={patient.id}
            className="rounded-xl border border-[#dedee1] bg-white p-3 shadow-[0px_1px_3px_#a2a6b025]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-title-4m text-black truncate">{patient.name}</p>
                <p className="font-title-5l text-x-70">{patient.age}</p>
              </div>
              <span
                className={`inline-flex items-center justify-center px-2.5 py-[5px] rounded-[100px] ${patient.statusBg}`}
              >
                <span className={`font-title-4r ${patient.statusText}`}>
                  {patient.status}
                </span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
              <p className="font-title-5l text-x-70">Phone</p>
              <p className="font-title-4r text-black text-right">{patient.phone}</p>
              <p className="font-title-5l text-x-70">Gender</p>
              <p className="font-title-4r text-black text-right">{patient.gender}</p>
              <p className="font-title-5l text-x-70">Reason</p>
              <p className="font-title-4r text-black text-right truncate">{patient.reason}</p>
              <p className="font-title-5l text-x-70">Doctor</p>
              <p className="font-title-4r text-black text-right truncate">{patient.doctor}</p>
              <p className="font-title-5l text-x-70">Appointment</p>
              <p className="font-title-4r text-black text-right">
                {patient.appointmentDate} {patient.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap pl-5 h-10">
                Patient Name
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Phone Number
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Gender
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Reason
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Doctor Assigned
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Status
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Appointment date
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Time
              </TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patientData.map((patient) => (
              <TableRow
                key={patient.id}
                className="bg-white border-b border-[#dedee1] h-[66px] hover:bg-white"
              >
                <TableCell className="pl-5 py-0">
                  <div className="flex flex-col items-start justify-center">
                    <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] whitespace-nowrap [font-style:var(--title-4m-font-style)]">
                      {patient.name}
                    </span>
                    <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] leading-[var(--title-5l-line-height)] tracking-[var(--title-5l-letter-spacing)] whitespace-nowrap [font-style:var(--title-5l-font-style)]">
                      {patient.age}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-0">
                  <div className="flex items-center gap-[5px]">
                    <Phone className="w-4 h-4 text-x-70" strokeWidth={1.8} />
                    <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                      {patient.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-0">
                  <div className="flex items-center gap-2.5">
                    <UserRound
                      className="w-4 h-4 text-x-70"
                      strokeWidth={1.8}
                    />
                    <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                      {patient.gender}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-0">
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                    {patient.reason}
                  </span>
                </TableCell>
                <TableCell className="py-0">
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                    {patient.doctor}
                  </span>
                </TableCell>
                <TableCell className="py-0">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-[5px] rounded-[100px] ${patient.statusBg}`}
                  >
                    <span
                      className={`font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)] ${patient.statusText}`}
                    >
                      {patient.status}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="py-0">
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                    {patient.appointmentDate}
                  </span>
                </TableCell>
                <TableCell className="py-0">
                  <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                    {patient.time}
                  </span>
                </TableCell>
                <TableCell className="py-0">
                  <MoreHorizontal
                    className="w-5 h-5 text-x-70 cursor-pointer hover:text-black transition-colors"
                    strokeWidth={1.8}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
