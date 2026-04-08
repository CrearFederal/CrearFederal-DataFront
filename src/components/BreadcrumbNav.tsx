import { useMemo } from "react";
import { ChevronRight, Globe } from "lucide-react";

import type { NavigationState } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import { isNavigationAllowed } from "../data/roles";

import {
  getProvincia,
  getMunicipio,
  getClub,
} from "../data/dataUtils";

// ---------------- TYPES ----------------

interface BreadcrumbNavProps {
  navigation: NavigationState;
  onNavigate: (nav: NavigationState) => void;
  roleConfig: UserRoleConfig;
}

interface BreadcrumbItem {
  label: string;
  nav: NavigationState;
  active: boolean;
}

// ---------------- COMPONENT ----------------

function BreadcrumbNav({
  navigation,
  onNavigate,
  roleConfig,
}: BreadcrumbNavProps) {
  // -------- BUILD ITEMS --------
  const items = useMemo<BreadcrumbItem[]>(() => {
    const list: BreadcrumbItem[] = [];

    // COUNTRY
    if (roleConfig.role === "coa") {
      list.push({
        label: "Argentina",
        nav: { level: "country" },
        active: navigation.level === "country",
      });
    }

    // PROVINCE
    if (navigation.provinciaId) {
      const provincia = getProvincia(navigation.provinciaId);

      list.push({
        label: provincia?.nombre || "Provincia",
        nav: {
          level: "province",
          provinciaId: navigation.provinciaId,
        },
        active: navigation.level === "province",
      });
    }

    // CITY
    if (navigation.municipioId) {
      const municipio = getMunicipio(navigation.municipioId);

      list.push({
        label: municipio?.nombre || "Municipio",
        nav: {
          level: "city",
          provinciaId: navigation.provinciaId,
          municipioId: navigation.municipioId,
        },
        active: navigation.level === "city",
      });
    }

    // CLUB
    if (navigation.clubId) {
      const club = getClub(navigation.clubId);

      list.push({
        label: club?.nombre || "Club",
        nav: navigation,
        active: true,
      });
    }

    return list;
  }, [navigation, roleConfig]);

  // -------- RENDER --------

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Globe className="mr-1 h-4 w-4 text-primary" />

      {items.map((item) => {
        const allowed = isNavigationAllowed(roleConfig, item.nav);

        return (
          <span
            key={`${item.nav.level}-${item.label}`}
            className="flex items-center gap-1"
          >
            {/* Separator */}
            {item !== items[0] && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}

            {/* Item */}
            <button
              onClick={() => {
                if (allowed) onNavigate(item.nav);
              }}
              disabled={!allowed}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                item.active
                  ? "font-medium text-foreground"
                  : allowed
                  ? "text-muted-foreground hover:text-foreground"
                  : "cursor-default text-muted-foreground/50"
              }`}
            >
              {item.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

export default BreadcrumbNav;