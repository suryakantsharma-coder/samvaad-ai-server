import React from "react";
import { toast as toastify, ToastOptions } from "react-toastify";
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";

const toastBody = (
  type: "success" | "error" | "warning",
  title: string,
  message: string,
  closeToast?: () => void,
) => (
  <div className="relative flex items-start gap-3 w-full pr-8">
    <span className="shrink-0 mt-0.5">
      {type === "success" && (
        <CheckCircle2 className="w-6 h-6 text-[#00955C]" aria-hidden />
      )}
      {type === "error" && (
        <AlertCircle className="w-6 h-6 text-[#dc2626]" aria-hidden />
      )}
      {type === "warning" && (
        <AlertTriangle className="w-6 h-6 text-[#ea580c]" aria-hidden />
      )}
    </span>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-[#333333] text-sm leading-tight">
        {title}
      </p>
      <p className="text-[#333333]/90 text-sm mt-0.5 leading-snug">{message}</p>
    </div>
    {closeToast && (
      <button
        type="button"
        onClick={closeToast}
        className="absolute top-3 right-3 p-1 rounded hover:bg-black/5 text-[#333333] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-2"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    )}
  </div>
);

const defaultOptions: ToastOptions = {
  icon: false,
  closeButton: false,
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  className: "toast-custom",
  bodyClassName: "p-0",
};

export function showSuccess(title: string, message: string) {
  toastify.success(
    ({ closeToast }) => toastBody("success", title, message, closeToast),
    { ...defaultOptions, className: "toast-custom toast-success" },
  );
}

export function showError(title: string, message: string) {
  toastify.error(
    ({ closeToast }) => toastBody("error", title, message, closeToast),
    { ...defaultOptions, className: "toast-custom toast-error" },
  );
}

export function showWarning(title: string, message: string) {
  toastify.warning(
    ({ closeToast }) => toastBody("warning", title, message, closeToast),
    { ...defaultOptions, className: "toast-custom toast-warning" },
  );
}
