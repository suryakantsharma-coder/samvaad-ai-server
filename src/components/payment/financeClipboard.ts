import { showError, showSuccess } from "../../lib/toast";

export async function copyFinanceLabelToClipboard(
  label: string,
  text: string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess("Copied", `${label} copied to clipboard.`);
  } catch {
    showError("Copy failed", "Could not copy to clipboard.");
  }
}
