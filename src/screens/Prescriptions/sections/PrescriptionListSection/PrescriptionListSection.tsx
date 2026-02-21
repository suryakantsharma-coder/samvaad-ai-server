import {
  Filter as FilterIcon,
  Search as SearchIcon,
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
import { ListError } from "../../../../components/ui/list-error";
import { LoadingSpinner } from "../../../../components/ui/loading-spinner";
import { Pagination } from "../../../../components/ui/pagination";
import { usePrescription } from "../../../../contexts/PrescriptionProvider";
import type { PrescriptionStatusFilter } from "../../../../data/prescription";
import { Prescription } from "../../../../types/prescription.type";

const STATUS_TABS: { id: "all" | PrescriptionStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Draft", label: "Draft" },
  { id: "Sent", label: "Sent" },
  { id: "Completed", label: "Completed" },
];

const statusColorMap = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-[#dffff2] text-[#00955b]";
    case "Sent":
      return "bg-[#d5eaff] text-[#007cff]";
    case "Draft":
      return "bg-[#fff1e0] text-[#ff9000]";
    default:
      return "bg-[#e6e6e6] text-[#757575]";
  }
};

function formatFollowUp(
  followUp: Prescription["followUp"],
): string {
  if (!followUp) return "—";
  return `${followUp.value} ${followUp.unit}`;
}

function formatDuration(prescription: Prescription): string {
  const first = prescription.medicines?.[0];
  if (!first?.duration) return "—";
  return `${first.duration.value} ${first.duration.unit}`;
}

export const PrescriptionListSection = ({
  onEditPrescription,
  onDeletePrescription,
  onMarkAsDonePrescription,
  onViewRecord,
}: {
  onEditPrescription: (prescription: Prescription) => void;
  onDeletePrescription: (prescription: Prescription) => void;
  onMarkAsDonePrescription: (prescription: Prescription) => void;
  onViewRecord?: (prescription: Prescription) => void;
}): JSX.Element => {
  const [activeTab, setActiveTab] = useState<"all" | PrescriptionStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
  } = usePrescription();

  const listToShow =
    searchQuery.trim() === ""
      ? prescriptions
      : searchedPrescriptions ?? [];

  useEffect(() => {
    handleGetPrescriptions(1, limit, {
      status: activeTab === "all" ? undefined : activeTab,
    });
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchPrescriptions(searchQuery);
      } else {
        resetSearchedPrescriptions();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTabChange = (value: string) => {
    if (value === "all" || value === "Draft" || value === "Sent" || value === "Completed") {
      setActiveTab(value as "all" | PrescriptionStatusFilter);
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
        <ListError message={error ?? undefined} />
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
          {STATUS_TABS.map((tab) => (
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
              placeholder="Search patient, medicine, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <Select
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <SelectTrigger className="flex w-[107px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
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
                    Appointment Date
                  </TableHead>
                  <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listToShow.map((prescription) => (
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
                    <TableCell className="px-[10px] py-[16px]">
                      <Badge
                        className={`${statusColorMap(
                          prescription.status,
                        )} rounded-[100px] px-2.5 py-[5px] font-title-4r font-[number:var(--title-4r-font-weight)] text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] hover:${statusColorMap(
                          prescription.status,
                        )}`}
                      >
                        {prescription.status}
                      </Badge>
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
                            onClick={() =>
                              onMarkAsDonePrescription(prescription)
                            }
                          >
                            Mark as done
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onDeletePrescription(prescription)
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
        </div>
      </div>
      {searchQuery.trim() === "" && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) =>
            handleGetPrescriptions(page, limit, {
              status: activeTab === "all" ? undefined : activeTab,
            })
          }
          disabled={loading}
        />
      )}
    </section>
  );
};
