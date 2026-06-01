import { Card, CardContent } from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { CalendarDays, MoreHorizontal } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import { formatRangeDisplay } from "../../dashboardResponse";

export const AppointmentListSection = (): JSX.Element => {
  const { response, dateRange } = useDashboardData();
  const rows = response.appointmentRows;
  const rangeLabel = formatRangeDisplay(dateRange.start, dateRange.end);

  return (
    <Card className="w-full h-auto xl:h-[965px] min-h-0 max-h-full flex flex-col bg-white rounded-[10px] overflow-hidden shadow-[0px_2px_6px_#a2a6b040] border-0">
      <CardContent className="p-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden gap-0">
        <div className="flex flex-col gap-2 mt-5 px-4 md:px-5 flex-shrink-0 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2.5 p-[5px] bg-grey-light rounded-[100px]">
              <CalendarDays
                className="w-[22px] h-[22px] text-x-70"
                strokeWidth={1.8}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-black font-title-3r font-[number:var(--title-3r-font-weight)] text-[length:var(--title-3r-font-size)] tracking-[var(--title-3r-letter-spacing)] leading-[var(--title-3r-line-height)] whitespace-nowrap [font-style:var(--title-3r-font-style)]">
                Appointments
              </span>
              <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] leading-[var(--title-5l-line-height)] tracking-[var(--title-5l-letter-spacing)] [font-style:var(--title-5l-font-style)] truncate">
                {rangeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-5 md:hidden">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-[#dedee1] bg-white p-3 shadow-[0px_1px_3px_#a2a6b025]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-title-4m text-black truncate">{row.patient}</p>
                  <p className="font-title-5l text-x-70">{row.age}</p>
                </div>
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-[5px] rounded-[100px] ${row.statusBg}`}
                >
                  <span className={`font-title-4r ${row.statusText}`}>
                    {row.status}
                  </span>
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                <p className="font-title-5l text-x-70">Time</p>
                <p className="font-title-4r text-black text-right">{row.time}</p>
                <p className="font-title-5l text-x-70">Doctor</p>
                <p className="font-title-4r text-black text-right truncate">{row.doctor}</p>
                <p className="font-title-5l text-x-70">Type</p>
                <p className="font-title-4r text-black text-right">{row.type}</p>
                <p className="font-title-5l text-x-70">Date</p>
                <p className="font-title-4r text-black text-right">{row.date}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block min-h-0 flex-1 w-full overflow-x-auto overflow-y-auto px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap pl-3 h-10">
                  Time
                </TableHead>
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                  Patient
                </TableHead>
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                  Type
                </TableHead>
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                  Doctor
                </TableHead>
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                  Status
                </TableHead>
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10">
                  Date
                </TableHead>
                <TableHead className="font-title-4m font-[number:var(--title-4m-font-weight)] text-[length:var(--title-4m-font-size)] leading-[var(--title-4m-line-height)] text-black tracking-[var(--title-4m-letter-spacing)] [font-style:var(--title-4m-font-style)] whitespace-nowrap h-10 pr-3">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="bg-white border-b border-[#dedee1] h-[66px] hover:bg-white"
                >
                  <TableCell className="pl-3 py-0">
                    <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                      {row.time}
                    </span>
                  </TableCell>
                  <TableCell className="py-0">
                    <div className="flex flex-col items-start justify-center">
                      <span className="font-title-4m font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] whitespace-nowrap [font-style:var(--title-4m-font-style)]">
                        {row.patient}
                      </span>
                      <span className="font-title-5l font-[number:var(--title-5l-font-weight)] text-x-70 text-[length:var(--title-5l-font-size)] leading-[var(--title-5l-line-height)] tracking-[var(--title-5l-letter-spacing)] whitespace-nowrap [font-style:var(--title-5l-font-style)]">
                        {row.age}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-0">
                    <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                      {row.type}
                    </span>
                  </TableCell>
                  <TableCell className="py-0">
                    <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                      {row.doctor}
                    </span>
                  </TableCell>
                  <TableCell className="py-0">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-[5px] rounded-[100px] ${row.statusBg}`}
                    >
                      <span
                        className={`font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)] ${row.statusText}`}
                      >
                        {row.status}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="py-0">
                    <span className="font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] whitespace-nowrap [font-style:var(--title-4r-font-style)]">
                      {row.date}
                    </span>
                  </TableCell>
                  <TableCell className="py-0 pr-3">
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
      </CardContent>
    </Card>
  );
};
