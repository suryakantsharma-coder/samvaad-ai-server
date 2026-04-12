import {
  MoreVertical as MoreVerticalIcon,
  Search as SearchIcon,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { ListError } from "../../../../components/ui/list-error";
import { Pagination } from "../../../../components/ui/pagination";
import type { MedicineCatalogRow } from "../../../../types/medicineCatalog.type";

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Type" },
  { value: "Tablet", label: "Tablet" },
  { value: "Capsule", label: "Capsule" },
  { value: "Injection", label: "Injection" },
  { value: "Syrup", label: "Syrup" },
  { value: "Other", label: "Other" },
] as const;

interface MedicineListSectionProps {
  rows: MedicineCatalogRow[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (row: MedicineCatalogRow) => void;
  onDelete: (row: MedicineCatalogRow) => void;
}

export const MedicineListSection = ({
  rows,
  loading,
  error,
  searchQuery,
  onSearchQueryChange,
  typeFilter,
  onTypeFilterChange,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: MedicineListSectionProps): JSX.Element => {
  const tableLoading = loading && rows.length === 0;
  const showError = Boolean(error) && !loading;

  if (showError) {
    return (
      <section className="flex flex-col bg-white rounded-[10px] overflow-hidden">
        <ListError message={error ?? "Something went wrong."} />
      </section>
    );
  }

  return (
    <section className="flex flex-col bg-white rounded-[10px] overflow-hidden border border-[#dedee1]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-[26px]">
        <div className="flex w-full lg:w-[min(100%,520px)] items-center gap-2.5 px-[8px] py-[6px] bg-grey-light rounded-[100px] h-[38px]">
          <SearchIcon className="w-6 h-6 text-black opacity-70 shrink-0" />
          <Input
            placeholder="Search by medicine name, ID,..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="flex-1 border-0 bg-transparent opacity-70 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-[15px]">
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="flex w-[120px] items-center justify-between px-[15px] py-2 bg-grey-light rounded-[100px] border-0 font-title-4r font-[number:var(--title-4r-font-weight)] text-black text-[length:var(--title-4r-font-size)] tracking-[var(--title-4r-letter-spacing)] leading-[var(--title-4r-line-height)] [font-style:var(--title-4r-font-style)]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col overflow-x-auto -mx-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-grey-dark hover:bg-grey-dark border-0">
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Medicine Name
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Medicine ID
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Type
              </TableHead>
              <TableHead className="font-title-4m leading-[19px] px-[20px] py-[10px] font-[number:var(--title-4m-font-weight)] text-black text-[length:var(--title-4m-font-size)] tracking-[var(--title-4m-letter-spacing)] leading-[var(--title-4m-line-height)] [font-style:var(--title-4m-font-style)]">
                Units
              </TableHead>
              <TableHead className="w-[72px] font-title-4m leading-[19px] px-[20px] py-[10px] text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableLoading ? (
              <TableLoadingRow colSpan={5} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 font-title-4r text-x-70"
                >
                  No medicines match your search.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row._id} className="border-b border-[#f0f0f2]">
                  <TableCell className="px-[20px] py-4 font-title-4r text-black">
                    {row.name}
                  </TableCell>
                  <TableCell className="px-[20px] py-4 font-title-4r text-x-70">
                    {row.medicineId || "—"}
                  </TableCell>
                  <TableCell className="px-[20px] py-4 font-title-4r text-black">
                    {row.type}
                  </TableCell>
                  <TableCell className="px-[20px] py-4 font-title-4r text-x-70">
                    {row.units}
                  </TableCell>
                  <TableCell className="px-[20px] py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          aria-label="Row actions"
                        >
                          <MoreVerticalIcon className="h-5 w-5 text-x-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(row)}>
                          Edit unit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(row)}
                          className="text-red-600 focus:text-red-600"
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={loading}
      />
    </section>
  );
};
