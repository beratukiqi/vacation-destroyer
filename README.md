# Semester ansökan

Semesteransökningsapp för Domstolsverket IT — byggd med Next.js 14 (App Router), TypeScript och SCSS-moduler.

## Installation

```bash
npm install
npm run dev
```

Öppna http://localhost:3000.

## Vy-växling

Appen demonstrerar två roller — anställd och chef. Växla i sidopanelens nedre roll-kort (klicka på namnet).

## Struktur

```
src/
  app/
    layout.tsx          App-shell, fonts, globala SCSS
    page.tsx            Root-routing och state-management
  components/
    Sidebar.tsx
    Topbar.tsx
    EmployeeDashboard.tsx
    NewRequestForm.tsx
    EmployeeForm.tsx
    ManagerDecisions.tsx
    ManagerCalendar.tsx
    SupportCalendar.tsx
    TeamRoster.tsx
    ui/                 Återanvändbara komponenter (Icon, Pill, Avatar, Modal, Toast)
  lib/
    data.ts             Mockdata + helpers
    types.ts            TypeScript-typer
  styles/
    globals.scss        Reset + theme tokens
    _tokens.scss        Färger, spacing, typografi
    *.module.scss       Komponent-specifika moduler
```

## Tekniska val

- **App Router** med RSC stängt av (`'use client'`) eftersom hela UI är interaktivt.
- **State** hålls i root `<App/>` och passas ned som props. Inga externa libraries.
- **SCSS-moduler** för komponent-isolering. Globala tokens i `:root` via `globals.scss`.
- **Inga API-anrop** — all data ligger statiskt i `lib/data.ts` och muteras i React state.

## Migrera till backend

Ersätt useState-arrayerna i `page.tsx` med React Query / SWR mot ditt API. Data-typerna i `lib/types.ts` är redan API-kontraktets utgångspunkt.
