import {
  Filter as FilterIcon,
  Search as SearchIcon,
  MoreVertical as ThreeDotsVerticalIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { Input } from "../../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLoadingRow,
  TableRow,
} from "../../../../components/ui/table";
import { ListError } from "../../../../components/ui/list-error";
import { Pagination } from "../../../../components/ui/pagination";
import { usePrescription } from "../../../../contexts/PrescriptionProvider";
import { openPrescriptionReportPdfInNewTab } from "../../../../lib/prescriptionPdf";
import {
  type PrescriptionDuration,
  Prescription,
} from "../../../../types/prescription.type";

function formatFollowUp(followUp: Prescription["followUp"]): string {
  if (!followUp) return "—";
  return `${followUp.value} ${followUp.unit}`;
}

function formatDuration(prescription: Prescription): string {
  const first = prescription.medicines?.[0];
  if (!first?.duration) return "—";
  return `${first.duration.value} ${first.duration.unit}`;
}

function addDurationToDate(start: Date, duration: PrescriptionDuration): Date {
  const end = new Date(start.getTime());
  const v = duration.value;
  switch (duration.unit) {
    case "Days":
      end.setDate(end.getDate() + v);
      break;
    case "Weeks":
      end.setDate(end.getDate() + v * 7);
      break;
    case "Months":
      end.setMonth(end.getMonth() + v);
      break;
    default:
      break;
  }
  return end;
}

/** Latest course end among medicines (appointment date + each line's duration). */
function formatPrescriptionEndDate(prescription: Prescription): string {
  if (!prescription.appointmentDate || !prescription.medicines?.length) {
    return "—";
  }
  const start = new Date(prescription.appointmentDate);
  if (Number.isNaN(start.getTime())) return "—";

  let latest: Date | null = null;
  for (const m of prescription.medicines) {
    if (m.duration == null || m.duration.value == null) continue;
    const end = addDurationToDate(start, m.duration);
    if (!latest || end > latest) latest = end;
  }

  if (!latest) return "—";
  return latest.toLocaleDateString();
}

export const PrescriptionListSection = ({
  onEditPrescription,
  onDeletePrescription,
  onMarkAsDonePrescription,
  onViewRecord,
  onPrescriptionReport,
  listStartDate = "",
  listEndDate = "",
}: {
  onEditPrescription: (prescription: Prescription) => void;
  onDeletePrescription: (prescription: Prescription) => void;
  onMarkAsDonePrescription: (prescription: Prescription) => void;
  onViewRecord?: (prescription: Prescription) => void;
  onPrescriptionReport?: (prescription: Prescription) => void;
  listStartDate?: string;
  listEndDate?: string;
}): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const hadSearchRef = useRef(false);
  const {
    prescriptions,
    searchedPrescriptions,
    loading,
    error,
    limit,
    totalPages,
    currentPage,
    handleGetPrescriptions,
    handleSearchPrescriptions,
    resetSearchedPrescriptions,
    currentStatusFilter,
  } = usePrescription();

  const isSearching = searchQuery.trim() !== "";
  /** Search uses GET /api/prescriptions/search — server-paginated page in `searchedPrescriptions`. */
  const listToShow = isSearching
    ? (searchedPrescriptions ?? [])
    : prescriptions;

  useEffect(() => {
    handleGetPrescriptions(1, limit, {
      startDate: listStartDate,
      endDate: listEndDate,
      ...(currentStatusFilter != null ? { status: currentStatusFilter } : {}),
    });
  }, [limit, listStartDate, listEndDate, currentStatusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = searchQuery.trim();
      if (q) {
        hadSearchRef.current = true;
        void handleSearchPrescriptions(q, 1, limit);
      } else {
        resetSearchedPrescriptions();
        if (hadSearchRef.current) {
          hadSearchRef.current = false;
          void handleGetPrescriptions(1, limit, {
            startDate: listStartDate,
            endDate: listEndDate,
            ...(currentStatusFilter != null
              ? { status: currentStatusFilter }
              : {}),
          });
        }
      }
    }, 300);
    return () => window.clearTimeout(timer);
    // Intentionally omit handler identities — provider recreates them each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce only on query / list scope
  }, [searchQuery, limit, listStartDate, listEndDate, currentStatusFilter]);

  const tableLoading = loading && listToShow.length === 0;
  const showError = error && !loading;

  if (showError) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
        <ListError message={error ?? undefined} />
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <div className="flex flex-wrap items-center gap-[15px] w-full lg:w-auto lg:ml-auto">
          <div className="flex w-full lg:w-[372px] items-center gap-2.5 px-2 py-2 bg-grey-light rounded-[100px] h-[38px]">
            <SearchIcon className="w-6 h-6 text-black opacity-70" />
            <Input
              placeholder="Search patient, medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

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
                    Medicines
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Duration
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Follow Up
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Appointment Date
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    End date
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableLoading ? (
                  <TableLoadingRow colSpan={7} />
                ) : listToShow.length === 0 ? (
                  <TableRow className="border-b border-[#dedee1]">
                    <TableCell
                      colSpan={7}
                      className="px-[20px] py-10 text-center text-x-70 font-title-4r"
                    >
                      No prescriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  listToShow.map((prescription) => (
                    <TableRow
                      key={prescription._id}
                      className="border-b border-[#dedee1] hover:bg-grey-light/50"
                    >
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] text-black font-medium text-[14px] leading-[19px] font-[number:var(--title-4l-font-weight)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {prescription.patientName}
                        </span>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {prescription.medicines?.length ?? 0} medicine(s)
                          {prescription.medicines?.length
                            ? `: ${prescription.medicines.map((m) => m.name).join(", ")}`
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {formatDuration(prescription)}
                        </span>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {formatFollowUp(prescription.followUp)}
                        </span>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <div className="flex flex-col gap-[3px] px-[20px] py-[16px]">
                          <span className="font-title-4l font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                            {prescription.appointmentDate
                              ? new Date(
                                  prescription.appointmentDate,
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-[0px]">
                        <span className="font-title-4l px-[20px] py-[16px] font-[number:var(--title-4l-font-weight)] text-black text-[length:var(--title-4l-font-size)] tracking-[var(--title-4l-letter-spacing)] leading-[var(--title-4l-line-height)] [font-style:var(--title-4l-font-style)]">
                          {formatPrescriptionEndDate(prescription)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 px-[40px] py-[10px] hover:bg-transparent active:bg-transparent data-[state=open]:bg-transparent"
                            >
                              <ThreeDotsVerticalIcon className="h-6 w-6" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                void openPrescriptionReportPdfInNewTab(
                                  prescription,
                                )
                              }
                            >
                              View prescription
                            </DropdownMenuItem>
                            {onViewRecord && (
                              <DropdownMenuItem
                                onClick={() => onViewRecord(prescription)}
                              >
                                View record
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => onEditPrescription(prescription)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeletePrescription(prescription)}
                            >
                              Delete
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) =>
          isSearching
            ? void handleSearchPrescriptions(searchQuery.trim(), page, limit)
            : void handleGetPrescriptions(page, limit, {
                startDate: listStartDate,
                endDate: listEndDate,
                ...(currentStatusFilter != null
                  ? { status: currentStatusFilter }
                  : {}),
              })
        }
        disabled={loading}
      />
    </section>
  );
};
