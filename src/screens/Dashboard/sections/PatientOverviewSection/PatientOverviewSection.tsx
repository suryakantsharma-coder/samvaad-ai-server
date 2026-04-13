import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Pagination } from "../../../../components/ui/pagination";
import { Users, Phone, UserRound, MoreHorizontal } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";

export const PatientOverviewSection = (): JSX.Element => {
  const { response, patientOverviewPage, setPatientOverviewPage, loading } =
    useDashboardData();
  const patientData = response.patients;
  const meta = response.patientOverviewMeta;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);

  return (
    <div className="w-full flex flex-col gap-5 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
            <Users className="w-[22px] h-[22px] text-x-70" strokeWidth={1.8} />
          </div>
          <span className="font-title-3r font-[number:var(--title-3r-font-weight)] text-[length:var(--title-3r-font-size)] leading-[var(--title-3r-line-height)] text-black tracking-[var(--title-3r-letter-spacing)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
            Patient Overview
          </span>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap pl-5 h-10">Patient Name</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Phone Number</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Gender</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Reason</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Doctor Assigned</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Status</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Appointment date</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Time</TableHead>
              <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patientData.map((patient) => (
              <TableRow key={patient.id} className="bg-white border-b border-[#dedee1] h-[66px] hover:bg-white">
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
                    <UserRound className="w-4 h-4 text-x-70" strokeWidth={1.8} />
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
                  <span className={`inline-flex items-center justify-center px-2.5 py-[5px] rounded-[100px] ${patient.statusBg}`}>
                    <span className={`font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)] ${patient.statusText}`}>
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
                  <MoreHorizontal className="w-5 h-5 text-x-70 cursor-pointer hover:text-black transition-colors" strokeWidth={1.8} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {meta != null && meta.totalPages > 1 ? (
        <Pagination
          currentPage={patientOverviewPage}
          totalPages={totalPages}
          onPageChange={setPatientOverviewPage}
          disabled={loading}
        />
      ) : null}
    </div>
  );
};
