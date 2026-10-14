---
title: "feat: Dashboard adaptado a federaciones de deporte único"
type: feat
date: 2026-10-14
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# feat: Dashboard adaptado a federaciones de deporte único

## Summary

Cuando el usuario es una federación con deporte asignado (ej. Rugby), el Dashboard `/` hoy muestra gráficos y KPIs pensados para comparar deportes entre sí. Como el backend ya filtra todo por `scope.deporteId`, esos gráficos quedan con una sola barra/ítem y no aportan nada. Este plan los oculta para ese rol y los reemplaza por información del propio deporte. Cambio solo de frontend (presentación); no se toca el backend.

## Problem Frame

Verificado en `CrearFederal-DataBack/src/models/stats.model.js`: las consultas de `/stats/deportes*` ya agregan `deporteId` del scope para federaciones. El front (`src/pages/Dashboard.tsx`) renderiza igual los componentes multi-deporte:

- `AthletesPerSportChart` (top 5 deportes) → una sola barra.
- `DeporteCoverageChart` (lista de deportes + cobertura por provincia) → lista de un ítem, sin deporte seleccionado hasta hacer click.
- KPIs "Cantidad de Deportes" y "Deporte líder" → siempre 1 / el mismo deporte.
- Modales de esos KPIs (`Deportes`, `Deporte líder`, `GenderBalanceByDeportChart`) → comparan deportes.

El filtro `filters.sports` ya se fija al deporte de la federación (`Dashboard.tsx`, efecto sobre `roleConfig`), lo que confirma la intención de "vista de un deporte".

## Requirements

- R1. Para `role === "federation"` con `deporteId`, ningún gráfico/KPI/modal del Dashboard compara contra otros deportes.
- R2. En su lugar se muestra información relevante del deporte: cobertura territorial, ranking territorial, participación por género y edades.
- R3. Aplica a todas las federaciones con `deporteId` (nacional, provincial, nodo, municipal).
- R4. Los demás roles (coa, province, municipality, club) no cambian.
- R5. Sin lógica de negocio nueva en el front: los datos salen de endpoints existentes.

## Scope Boundaries

- No se modifica `CrearFederal-DataBack`.
- Fuera de alcance: páginas `/evaluaciones`, `/infraestructura`, `/deteccion-talentos`, `AlertaBiotipo`.

### Deferred to Follow-Up Work

- Auditar las otras páginas para el rol federación.
- Alcance de federaciones provincial/nodo/municipal: ver Open Questions.

## Key Technical Decisions

- **Helper único `isSingleSportFederation(config)`** en `src/data/roles.ts` (`role === "federation" && deporteId != null`). Todos los condicionales del Dashboard usan este helper; evita repetir la condición y encaja con el módulo que ya concentra las reglas por rol.
- **Reemplazo, no solo ocultamiento**: se auto-selecciona el deporte de la federación para cargar la cobertura territorial al iniciar (reutilizando `handleDeporteClick`), sin esperar un click.
- **Reuso de componentes existentes** (`DeporteCoverageChart`, `AgeDistributionChart` con `genero`/`siblingAges`, `DeporteHeatMap`, modales existentes) con props nuevas mínimas, en vez de componentes nuevos.

## Implementation Units

### U1. Helper de rol deporte único

**Goal:** Un único predicado reutilizable.
**Requirements:** R1, R3, R4.
**Files:** `src/data/roles.ts`.
**Approach:** Exportar `isSingleSportFederation(config: UserRoleConfig | null): boolean`.
**Test scenarios:** Sin runner de tests en el repo (`package.json` no define `test`); `Test expectation: none -- predicado trivial, se cubre en la verificación manual de U2–U5`.
**Verification:** `npm run build` pasa; coa/province/club devuelven `false`; federación sin `deporteId` devuelve `false`.

### U2. Auto-selección del deporte y carga de cobertura

**Goal:** Al estar `authStatus === "ready"` y ser federación de deporte único, cargar `getDeporteProvincias(roleConfig.deporteId)` sin interacción.
**Dependencies:** U1.
**Files:** `src/pages/Dashboard.tsx`.
**Approach:** Efecto que llama a `handleDeporteClick(roleConfig.deporteId)` una vez por sesión/rol; respeta el patrón `AbortController` existente (`deporteProvinciasAbortRef`).
**Patterns to follow:** efecto de `getDeportesAll` (~línea 680) y `handleDeporteClick` (~línea 691).
**Test scenarios:**
- Federación Rugby nacional: tras login, `deporteProvincias` se carga sin click.
- Cambio de rol/recarga: no dispara llamadas duplicadas; abort correcto al desmontar.
- Rol coa: no dispara la carga automática.
**Verification:** Network muestra una sola llamada a `/stats/deportes/{id}/provincias` al entrar como federación.

### U3. KPIs de territorio en lugar de "Cantidad de deportes" / "Deporte líder"

**Goal:** Las dos tarjetas comparativas pasan a mostrar presencia territorial del deporte.
**Dependencies:** U1, U2.
**Files:** `src/pages/Dashboard.tsx` (bloque de KPIs, ~líneas 1134–1155), `src/components/KpiCard.tsx` solo si hace falta.
**Approach:** Para deporte único: "Provincias con presencia" (`deporteProvincias.totalProvincias`) y "Provincia líder" (`deportistasTotales.provinciaLider` con su `porcentaje`). Ambos `onClick` abren el modal de heatmap existente (`openDeporteHeatmapModal`). Los modales `Deportes` y `Deporte líder` quedan inaccesibles para este rol.
**Test scenarios:**
- Federación Rugby: se ven los KPIs nuevos con valores del backend; click abre el heatmap del deporte.
- Federación provincial: "Provincias con presencia" muestra 1 (comportamiento del back) — ver Open Questions.
- Datos aún cargando: placeholders "-" como los KPIs actuales.
- Rol coa: KPIs originales intactos.
**Verification:** No aparece la palabra "Deporte líder" ni "Cantidad de Deportes" para federación.

### U4. Columna derecha: sin "Atletas por deporte"

**Goal:** Reemplazar `AthletesPerSportChart` por distribución de edades por género del deporte.
**Dependencies:** U1.
**Files:** `src/pages/Dashboard.tsx` (~línea 1182), posiblemente `src/components/Charts.tsx`.
**Approach:** Mostrar `AgeDistributionChart` general más uno por género usando `edadesFemenino`/`edadesMasculino` (ya cargados en el Dashboard) con las props `genero`/`siblingAges` existentes. Verificar en implementación que esos estados se cargan también para federación (hoy se alimentan desde el modal de deportistas).
**Test scenarios:**
- Federación Rugby: no hay gráfico de top deportes; se ven edades por género con datos del deporte.
- Género sin datos: estado vacío sin romper el layout.
**Verification:** Layout de la fila 3 sin huecos en desktop y mobile.

### U5. Fila de cobertura: solo panel territorial del deporte

**Goal:** `DeporteCoverageChart` oculta la lista de deportes y muestra directamente la cobertura provincial del deporte único.
**Dependencies:** U1, U2.
**Files:** `src/components/Charts.tsx` (`DeporteCoverageChart`), `src/pages/Dashboard.tsx` (~línea 1203).
**Approach:** Nueva prop opcional (ej. `singleDeporte`) que omite el panel izquierdo y ocupa todo el ancho con el panel de provincias; el botón de heatmap se mantiene.
**Patterns to follow:** estructura actual de dos paneles del componente.
**Test scenarios:**
- Federación Rugby nacional: sin lista de deportes; panel de provincias visible desde el inicio.
- Cobertura cargando: estado de loading existente (`provinciasLoading`).
- Rol coa: componente idéntico al actual (prop ausente).
**Verification:** Revisión visual en desktop y mobile.

## Risks & Open Questions

- **Federaciones sub-nacionales (provincial/nodo/municipal):** el backend recorta por territorio, por lo que "cobertura por provincia" puede ser de una sola provincia. Decisión diferida a implementación: para esos niveles ocultar el panel provincial y mostrar el ranking que ya adapta el back (`ProvinceRankingChart`/`MunicipioRankingChart`) — confirmar qué devuelve `provinciasTop10`/`municipiosTop10` para esos scopes antes de decidir.
- `edadesFemenino`/`edadesMasculino` pueden no cargarse fuera del flujo de modales; confirmar en U4.
- Sin tests automatizados en el repo: la verificación es `npm run build`, `npm run lint` y recorrido manual con logins de federación nacional, federación provincial y coa (regresión).

## Verification Contract

- `npm run build` y `npm run lint` sin errores nuevos.
- Login federación nacional de Rugby: sin gráficos/KPIs/modales comparativos entre deportes; cobertura y edades del deporte visibles.
- Login federación provincial: layout coherente (sin tarjetas vacías).
- Login coa: Dashboard idéntico al actual.

## Definition of Done

R1–R5 cumplidos, verificación manual de los tres logins hecha, y sin cambios en `CrearFederal-DataBack`.
