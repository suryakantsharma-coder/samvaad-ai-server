import { cn } from "../../lib/utils";

interface ListErrorProps {
  message?: string;
  className?: string;
}

export const ListError = ({
  message = "Something went wrong. Please try again.",
  className,
}: ListErrorProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-16 px-4 text-center",
        className,
      )}
    >
      <p className="font-title-4r text-sm text-red-600">{message}</p>
      <p className="font-body-4r text-xs text-x-70">
        The request may have failed or expired. Refresh the page to retry.
      </p>
    </div>
  );
};
