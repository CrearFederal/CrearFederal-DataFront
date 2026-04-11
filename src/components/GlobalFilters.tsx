import { useState, useRef, useEffect, useMemo } from "react";
import type { Filters } from "../types/types";
import { getDeportes } from "../data/dataUtils";
import { ChevronDown, X } from "lucide-react";

// ---------------- TYPES ----------------

interface GlobalFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

type AgeCategory = "infantil" | "juvenil" | "mayor";

// ---------------- CONSTANTS ----------------

const AGE_CATEGORIES: {
  key: AgeCategory;
  label: string;
  range: [number, number];
}[] = [
  { key: "infantil", label: "Infantil (6-14)", range: [6, 14] },
  { key: "juvenil", label: "Juvenil (15-20)", range: [15, 20] },
  { key: "mayor", label: "Mayor (21+)", range: [21, 60] },
];

// ---------------- HELPERS ----------------

const getActiveAgeCategories = (
  ageRange: [number, number]
): AgeCategory[] => {
  return AGE_CATEGORIES.filter(
    (cat) => ageRange[0] <= cat.range[0] && ageRange[1] >= cat.range[1]
  ).map((cat) => cat.key);
};

const ageCategoriesToRange = (
  categories: AgeCategory[]
): [number, number] => {
  if (categories.length === 0) return [0, 0];

  let min = Infinity;
  let max = -Infinity;

  categories.forEach((catKey) => {
    const cat = AGE_CATEGORIES.find((c) => c.key === catKey);
    if (!cat) return;

    min = Math.min(min, cat.range[0]);
    max = Math.max(max, cat.range[1]);
  });

  return [min, max];
};

// ---------------- COMPONENT ----------------

function GlobalFilters({ filters, onChange }: GlobalFiltersProps) {
  // -------- DATA --------
  const deportes = useMemo(() => getDeportes(), []);

  // -------- STATE --------
  const [isSportOpen, setIsSportOpen] = useState(false);

  // -------- REFS --------
  const dropdownRef = useRef<HTMLDivElement>(null);

  // -------- DERIVED STATE --------
  const activeAgeCategories = useMemo(
    () => getActiveAgeCategories(filters.ageRange),
    [filters.ageRange]
  );

  const allAgesSelected = activeAgeCategories.length === AGE_CATEGORIES.length;

  const hasActiveFilters =
    filters.sports.length > 0 ||
    filters.gender.length > 0 ||
    !allAgesSelected;

  // -------- EFFECTS --------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSportOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -------- HANDLERS --------

  const toggleSport = (id: number) => {
    const updatedSports = filters.sports.includes(id) ? [] : [id];
    onChange({ ...filters, sports: updatedSports });
  };

  const setGender = (value: "todos" | "M" | "F") => {
    if (value === "todos") {
      onChange({ ...filters, gender: [] });
    } else {
      onChange({ ...filters, gender: [value] });
    }
  };

  const toggleAgeCategory = (category: AgeCategory) => {
    let updated = [...activeAgeCategories];

    if (updated.includes(category)) {
      updated = updated.filter((c) => c !== category);
    } else {
      updated.push(category);
    }

    // evitar vacío
    if (updated.length === 0) {
      updated = AGE_CATEGORIES.map((c) => c.key);
    }

    onChange({
      ...filters,
      ageRange: ageCategoriesToRange(updated),
    });
  };

  const clearAll = () => {
    onChange({
      sports: [],
      gender: [],
      ageRange: [6, 60],
    });
  };

  // -------- LABELS --------

  const sportLabel = useMemo(() => {
    if (filters.sports.length === 0) return "Deporte";

    if (filters.sports.length === 1) {
      return (
        deportes.find((d) => d.id_deporte === filters.sports[0])?.nombre ||
        "Deporte"
      );
    }

    return `${filters.sports.length} deportes`;
  }, [filters.sports, deportes]);

  // -------- RENDER --------

  return (
    <div className="relative z-[1000] flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
      {/* SPORTS */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsSportOpen((prev) => !prev)}
          className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${
            filters.sports.length > 0
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {sportLabel}
          <ChevronDown className="h-3 w-3" />
        </button>

        {isSportOpen && (
          <div className="absolute left-0 top-full z-[9999] mt-1 min-w-[160px] space-y-0.5 rounded-lg border border-border bg-card p-1.5 shadow-lg">
            {deportes.map((deporte) => (
              <button
                key={deporte.id_deporte}
                onClick={() => toggleSport(deporte.id_deporte)}
                className={`w-full rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                  filters.sports.includes(deporte.id_deporte)
                    ? "bg-primary/20 font-medium text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {deporte.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* GENDER */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-muted-foreground">Género:</span>

        {(["todos", "M", "F"] as const).map((g) => {
          const isActive =
            g === "todos"
              ? filters.gender.length === 0
              : filters.gender.length === 1 && filters.gender[0] === g;

          const label =
            g === "todos"
              ? "Todos"
              : g === "M"
              ? "Masculino"
              : "Femenino";

          return (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-full px-2.5 py-0.5 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* AGE */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-muted-foreground">Edad:</span>

        {AGE_CATEGORIES.map((cat) => {
          const isActive = activeAgeCategories.includes(cat.key);

          return (
            <button
              key={cat.key}
              onClick={() => toggleAgeCategory(cat.key)}
              className={`rounded-full px-2.5 py-0.5 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* CLEAR */}
      {hasActiveFilters && (
        <>
          <div className="h-4 w-px bg-border" />

          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        </>
      )}
    </div>
  );
}

export default GlobalFilters;