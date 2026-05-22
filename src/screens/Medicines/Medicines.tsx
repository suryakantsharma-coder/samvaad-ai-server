import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import {
  createMedicine,
  exportMedicinesCsv,
  fetchMedicinesList,
  searchMedicines,
  typeFilterToApiParam,
} from "../../data/medicines";
import { showSuccess } from "../../lib/toast";
import { isSuperAdminRole } from "../../lib/userRole";
import type { MedicineCatalogRow } from "../../types/medicineCatalog.type";
import { AddMedicineModal } from "./sections/AddMedicineModal";
import { DeleteMedicineModal } from "./sections/DeleteMedicineModal";
import { EditMedicineModal } from "./sections/EditMedicineModal";
import { MedicineListSection } from "./sections/MedicineListSection/MedicineListSection";
import { MedicinesHeaderSection } from "./sections/MedicinesHeaderSection/MedicinesHeaderSection";

const SEARCH_DEBOUNCE_MS = 350;
const MED_PAGE_SIZE = 20;

export const Medicines = (): JSX.Element => {
  const { user } = useAuth();
  const [rows, setRows] = useState<MedicineCatalogRow[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] =
    useState<MedicineCatalogRow | null>(null);
  const [medicinePendingDelete, setMedicinePendingDelete] =
    useState<MedicineCatalogRow | null>(null);

  const filterSigRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    if (!isSuperAdminRole(user?.role)) return;
    const ac = new AbortController();
    const filterSig = `${searchQuery}|${typeFilter}`;
    const filterChanged =
      filterSigRef.current !== null && filterSigRef.current !== filterSig;
    filterSigRef.current = filterSig;
    const needDebounce =
      filterChanged && searchQuery.trim().length > 0;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = searchQuery.trim();
        const typeApi = typeFilterToApiParam(typeFilter);
        const result = q
          ? await searchMedicines(
              q,
              currentPage,
              MED_PAGE_SIZE,
              { signal: ac.signal },
              typeApi,
            )
          : await fetchMedicinesList(
              currentPage,
              MED_PAGE_SIZE,
              { signal: ac.signal },
              typeApi,
            );
        if (ac.signal.aborted) return;
        setRows(result.rows);
        setTotalPages(Math.max(1, result.totalPages));

        const reportedTotal = result.total;
        if (typeof reportedTotal === "number") {
          setTotalCount(reportedTotal);
        } else if (currentPage === 1) {
          setTotalCount(
            Math.max(
              0,
              (currentPage - 1) * MED_PAGE_SIZE + result.rows.length,
            ),
          );
        } else {
          setTotalCount((prev) =>
            Math.max(prev ?? 0, currentPage * MED_PAGE_SIZE),
          );
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        const name = e instanceof Error ? e.name : "";
        if (name === "AbortError") return;
        setError(
          e instanceof Error ? e.message : "Failed to load medicines catalog.",
        );
        setRows([]);
        setTotalPages(1);
        setTotalCount(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    const delay = needDebounce ? SEARCH_DEBOUNCE_MS : 0;
    const t = window.setTimeout(() => void run(), delay);
    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [searchQuery, typeFilter, currentPage, user?.role]);

  if (!isSuperAdminRole(user?.role)) {
    return (
      <div className="w-full flex flex-col gap-4 p-4 md:p-6 max-w-prose">
        <h1 className="text-[32px] font-medium text-black [font-family:'Archivo',Helvetica]">
          Medicines
        </h1>
        <p className="text-[16px] text-x-70 leading-relaxed">
          The medicines catalog is available to Super Admin accounts. If you need
          access, contact your platform administrator.
        </p>
      </div>
    );
  }

  const displayTotal = totalCount ?? rows.length;

  return (
    <div className="w-full flex flex-col gap-[25px] p-4 md:p-6">
      <MedicinesHeaderSection
        totalMedicines={displayTotal}
        onAddMedicine={() => setAddOpen(true)}
        onExport={() => {
          exportMedicinesCsv(rows);
          showSuccess("Exported", "Medicines list downloaded as CSV.");
        }}
      />
      <MedicineListSection
        rows={rows}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onEdit={(row) => setEditingMedicine(row)}
        onDelete={(row) => setMedicinePendingDelete(row)}
      />
      <AddMedicineModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={async (payload) => {
          const row = await createMedicine(payload);
          setRows((prev) => [row, ...prev]);
          setTotalCount((t) => (typeof t === "number" ? t + 1 : t));
          showSuccess("Added", "Medicine added to the catalog.");
        }}
      />
      <DeleteMedicineModal
        medicine={medicinePendingDelete}
        open={medicinePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMedicinePendingDelete(null);
        }}
        onDeleted={(id) => {
          setRows((prev) => prev.filter((r) => r._id !== id));
          setTotalCount((t) =>
            typeof t === "number" ? Math.max(0, t - 1) : t,
          );
          showSuccess("Deleted", "Medicine removed.");
        }}
      />
      <EditMedicineModal
        medicine={editingMedicine}
        open={editingMedicine !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMedicine(null);
        }}
        onSaved={(updated) => {
          if (!editingMedicine) return;
          setRows((prev) =>
            prev.map((r) =>
              r._id === editingMedicine._id
                ? {
                    ...r,
                    ...updated,
                    _id: r._id,
                    name: updated.name || r.name,
                    medicineId: updated.medicineId || r.medicineId,
                    type: updated.type || r.type,
                    units: updated.units || r.units,
                  }
                : r,
            ),
          );
          showSuccess("Updated", "Medicine saved.");
          setEditingMedicine(null);
        }}
      />
    </div>
  );
};
