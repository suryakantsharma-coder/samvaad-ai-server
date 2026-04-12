/**
 * @deprecated Import from `./medicines` instead.
 */
import type { MedicineCatalogRow } from "../types/medicineCatalog.type";
import { fetchMedicinesList } from "./medicines";

export { exportMedicinesCsv, fetchMedicinesList } from "./medicines";

/** @deprecated Use `fetchMedicinesList` for totals. */
export async function getMedicineCatalog(): Promise<MedicineCatalogRow[]> {
  const { rows } = await fetchMedicinesList();
  return rows;
}
