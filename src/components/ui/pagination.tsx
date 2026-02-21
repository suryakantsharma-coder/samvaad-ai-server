import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps): JSX.Element | null => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-[#dedee1] bg-grey-light/30">
      <p className="font-title-4r text-[#57575f] text-sm">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 border-[#dedee1] rounded-[6px] font-title-4r text-[#57575f] hover:bg-white disabled:opacity-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev || disabled}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 border-[#dedee1] rounded-[6px] font-title-4r text-[#57575f] hover:bg-white disabled:opacity-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext || disabled}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
