# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured yet.

## Architecture

Single-page dashboard app for COA (Argentine Olympic Committee) to visualize sports clubs and athletes across Argentina.

**Stack:** React 19 + TypeScript + Vite, Tailwind CSS, React Leaflet (interactive map), Recharts (charts), React Router v7.

### Data flow

All data is currently **mocked** (no API calls). The data layer lives in `src/data/`:

- `mockData.ts` — generates seeded deterministic data: 24 provinces, ~90 municipalities, ~300+ clubs, ~4000+ athletes, 8 sports, sport profiles
- `dataUtils.ts` — query functions over mock data: `getStats()`, `getProvinciaStats()`, `getClubes()`, `getClub()`, etc. All filtering (sport, gender, age range, geographic scope) happens here
- `roles.ts` — role-based access control: `UserRoleConfig` with roles `coa | province | club`, controls navigation permissions and map interactivity
- `argentinaGeoJson.ts` / `argentinaGeoData.ts` — GeoJSON data for province polygons rendered on the map
- `coordinates.ts` — generates lat/lng coordinates for clubs by municipality name

### Component hierarchy

```
App (Router)
└── Dashboard (main state container)
    ├── BreadcrumbNav        — navigation trail, breadcrumb drill-down
    ├── GlobalFilters        — sport/gender/age filter panel
    ├── KpiCard (×5)         — summary metric cards
    ├── LeafletMap           — interactive Argentina map
    │   ├── MarkerClusterGroup   — clustered club markers
    │   └── MapViewController    — imperative Leaflet view controller (zoom/pan)
    ├── Charts
    │   ├── AthletesPerSportChart
    │   └── GenderDistributionChart
    └── ClubDetailPanel      — modal panel showing club detail (shown when a club is selected)
```

`Dashboard` owns all state: `navigation` (NavigationLevel: country → province → city → club), `filters`, `selectedClubId`, and `roleConfig`. It passes data down to all children via props.

### Role system

Three roles gate what a user can see and navigate:
- `coa` — full access, can drill into any province
- `province` — locked to their own province, cannot go to country level
- `club` — sees only their own club's detail panel

Role is currently simulated via a dropdown in the header (dev only).

### Styling

Tailwind with a custom blue-toned design system defined as CSS variables in `src/index.css`. Token names follow shadcn/ui conventions (`--background`, `--foreground`, `--primary`, `--card`, `--border`, etc.). All colors use HSL. Use these tokens rather than raw hex/HSL values in new components.

Leaflet marker/cluster/tooltip styles are also in `src/index.css` (CSS classes like `.club-marker-icon`, `.cluster-small/medium/large`, `.club-tooltip`).

### Types

Core domain types in `src/types/types.ts`: `Provincia`, `Municipio`, `Club`, `Deportista`, `Deporte`, `PerfilDeportivo`, `NavigationState`, `NavigationLevel`, `Filters`.
