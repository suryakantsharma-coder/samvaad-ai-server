import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  message?: string;
}

export const LoadingSpinner = ({
  className,
  message = "Please wait",
}: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className,
      )}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div
          className="absolute h-24 w-24 animate-spin rounded-full border-4 border-grey-light border-t-primary-2"
          aria-hidden
        />
        <span className="absolute text-center font-title-4r text-sm text-x-70">
          {message}
        </span>
      </div>
    </div>
  );
};
