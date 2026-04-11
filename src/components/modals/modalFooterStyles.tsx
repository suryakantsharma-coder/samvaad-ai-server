import { dialogCloseButtonClassName } from "../ui/dialog-close-styles";

/** Footer row: right-aligned actions, spacing matches New Appointment modal */
export const modalFooterRowClassName = "flex justify-end gap-3 pt-4";

/** Secondary / dismiss action (Cancel, Close) — plain X icon beside label */
export const modalFooterCancelClassName =
  "text-gray-600 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-sm h-9 px-4 rounded-lg font-medium shadow-sm border-0";

/** Primary confirm (Save, etc.) — teal; use CircleCheck icon (outline circle + check) */
export const modalFooterPrimaryClassName =
  "bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-sm h-9 px-4 rounded-lg font-medium shadow-sm border-0";

export const modalFooterDangerClassName =
  "bg-red-600 hover:bg-red-700 text-white text-sm h-9 px-4 rounded-lg font-medium shadow-sm border-0";

/** Outline action (e.g. Print) */
export const modalFooterOutlineClassName =
  "bg-white border border-[#dedee1] hover:bg-grey-light text-gray-800 text-sm h-9 px-4 rounded-lg font-medium shadow-sm";

/** Dialog header corner close — same minimal X as default Dialog close */
export const modalHeaderCloseButtonClassName = dialogCloseButtonClassName;
