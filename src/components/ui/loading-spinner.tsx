import { cn } from "../../lib/utils";

export type LoadingSpinnerSize = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  className?: string;
  /** Ring size; default `sm` for compact UI (e.g. table rows). */
  size?: LoadingSpinnerSize;
  /** Optional caption below the ring (not inside the spinner). */
  label?: string;
}

const ringClass: Record<LoadingSpinnerSize, string> = {
  sm: "h-8 w-8 border-2",
  md: "h-11 w-11 border-[3px]",
  lg: "h-14 w-14 border-4",
};

export const LoadingSpinner = ({
  className,
  size = "sm",
  label,
}: LoadingSpinnerProps): JSX.Element => {
  const ring = ringClass[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-6 px-4",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "Loading"}
    >
      <div
        className={cn(
          "shrink-0 animate-spin rounded-full border-grey-light border-t-primary-2",
          ring,
        )}
      />
      {label ? (
        <span className="font-title-5r text-center text-xs text-x-70 max-w-xs">
          {label}
        </span>
      ) : null}
    </div>
  );
};
