// Mock data — organisations, employees, requests, holidays, support assignments.
// Replace with real API calls when migrating to a backend.

import type {
  Employee,
  Holiday,
  SupportAssignment,
  SupportGroup,
  SupportGroupId,
  Team,
  TeamId,
  VacationRequest,
} from './types';
import {
  addDays,
  fmt,
  isWeekend,
  makeIsHoliday,
  mondayOfWeek,
  parse,
  countDays as makeCountDays,
} from './dates';

export const TEAMS: Record<TeamId, Team> = {
  itdir: { id: 'itdir', name: 'IT-direktör', short: 'DIR' },
  datacenter: { id: 'datacenter', name: 'Enheten för Datacenter', short: 'DC' },
  digital: {
    id: 'digital',
    name: 'Enheten för digital interaktion och IT-säkerhet',
    short: 'DIS',
  },
  ekonomi: {
    id: 'ekonomi',
    name: 'Enheten för ekonomi och analysstöd',
    short: 'EAS',
  },
  arbetsplats: { id: 'arbetsplats', name: 'Enheten för IT-arbetsplats', short: 'AP' },
  mae1: {
    id: 'mae1',
    name: 'Enheten för IT-stöd inom mål och ärenden (1)',
    short: 'MÄ1',
  },
  mae2: {
    id: 'mae2',
    name: 'Enheten för IT-stöd inom mål och ärenden (2)',
    short: 'MÄ2',
  },
};

export const TEAM_ORDER: TeamId[] = [
  'itdir', 'datacenter', 'digital', 'ekonomi', 'arbetsplats', 'mae1', 'mae2',
];

export const SUPPORT_GROUPS: Record<SupportGroupId, SupportGroup> = {
  tfac:   { id: 'tfac',   name: 'TF Avdelningschef', short: 'TFAC' },
  itsup2: { id: 'itsup2', name: 'IT Support 2:a linje', short: 'IT2' },
  bered:  { id: 'bered',  name: 'Beredskap datahallar inkl utökad IT-beredskap', short: 'BER' },
  klient: { id: 'klient', name: 'Klient 3:e linje', short: 'KLI' },
  idm:    { id: 'idm',    name: 'IDM support 3:e linje', short: 'IDM' },
  incid:  { id: 'incid',  name: 'Incident manager', short: 'IM' },
  soc:    { id: 'soc',    name: 'SOC IT-SÄK', short: 'SOC' },
  vera:   { id: 'vera',   name: 'Vera support IT-3:e linje', short: 'VERA' },
  webb:   { id: 'webb',   name: 'Websupport 3:e linje (intranät + domstol.se + WP-siter)', short: 'WEB' },
  nms:    { id: 'nms',    name: 'NMS 4:e linje + e-Arkiv', short: 'NMS' },
  ea:     { id: 'ea',     name: 'EA support 3:e linje', short: 'EA' },
  etj:    { id: 'etj',    name: 'E-tjänst support 3:e linje', short: 'ETJ' },
  icc:    { id: 'icc',    name: 'ICC', short: 'ICC' },
  linux:  { id: 'linux',  name: 'Team Linux', short: 'LIN' },
  nat:    { id: 'nat',    name: 'Team Nät', short: 'NÄT' },
  dba:    { id: 'dba',    name: 'DBA', short: 'DBA' },
  winsrv: { id: 'winsrv', name: 'Team Windows SRV', short: 'WIN' },
  reg:    { id: 'reg',    name: 'Registerutdrag', short: 'REG' },
};

export const SUPPORT_GROUPS_ORDER: SupportGroupId[] = [
  'tfac', 'itsup2', 'bered', 'klient', 'idm', 'incid', 'soc',
  'vera', 'webb', 'nms', 'ea', 'etj', 'icc',
  'linux', 'nat', 'dba', 'winsrv', 'reg',
];

export const HOLIDAYS: Holiday[] = [
  { date: '2026-06-19', name: 'Midsommarafton' },
  { date: '2026-06-20', name: 'Midsommardagen' },
];

export const isHoliday = makeIsHoliday(HOLIDAYS);
export const countDays = makeCountDays(isHoliday);

export const EMPLOYEES: Employee[] = [
  { id: 'u01', name: 'Anna Lindqvist',     initials: 'AL', team: 'itdir',       role: 'chef',     support_groups: [],                            earned: 30, saved: 4, used: 0 },

  { id: 'u02', name: 'Erik Johansson',     initials: 'EJ', team: 'datacenter',  role: 'employee', support_groups: ['linux', 'bered'],             earned: 28, saved: 2, used: 6 },
  { id: 'u03', name: 'Linnea Nilsson',     initials: 'LN', team: 'datacenter',  role: 'employee', support_groups: ['winsrv', 'bered'],            earned: 30, saved: 5, used: 4 },
  { id: 'u04', name: 'Hugo Olsson',        initials: 'HO', team: 'datacenter',  role: 'employee', support_groups: ['winsrv', 'dba'],              earned: 25, saved: 0, used: 2 },
  { id: 'u23', name: 'Per Wallin',         initials: 'PW', team: 'datacenter',  role: 'employee', support_groups: ['nat', 'bered'],               earned: 30, saved: 3, used: 0 },
  { id: 'u24', name: 'Sofia Hedberg',      initials: 'SH', team: 'datacenter',  role: 'employee', support_groups: ['linux'],                      earned: 28, saved: 1, used: 5 },

  { id: 'u05', name: 'Stella Lund',        initials: 'SL', team: 'digital',     role: 'employee', support_groups: ['soc', 'incid'],               earned: 30, saved: 8, used: 8 },
  { id: 'u06', name: 'Isak Strand',        initials: 'IS', team: 'digital',     role: 'employee', support_groups: ['soc'],                        earned: 28, saved: 3, used: 5 },
  { id: 'u07', name: 'Maja Svensson',      initials: 'MS', team: 'digital',     role: 'employee', support_groups: ['webb'],                       earned: 30, saved: 6, used: 7 },
  { id: 'u08', name: 'Oskar Karlsson',     initials: 'OK', team: 'digital',     role: 'employee', support_groups: ['webb', 'etj'],                earned: 28, saved: 1, used: 9 },
  { id: 'u25', name: 'Mattias Engström',   initials: 'ME', team: 'digital',     role: 'employee', support_groups: ['soc', 'idm'],                 earned: 30, saved: 5, used: 0 },
  { id: 'u26', name: 'Cecilia Nyberg',     initials: 'CN', team: 'digital',     role: 'employee', support_groups: ['webb', 'etj'],                earned: 30, saved: 2, used: 3 },
  { id: 'u27', name: 'Tobias Lundqvist',   initials: 'TL', team: 'digital',     role: 'employee', support_groups: ['icc'],                        earned: 28, saved: 0, used: 4 },

  { id: 'u09', name: 'Viktor Andersson',   initials: 'VA', team: 'ekonomi',     role: 'employee', support_groups: ['ea'],                         earned: 30, saved: 4, used: 5 },
  { id: 'u10', name: 'Astrid Eriksson',    initials: 'AE', team: 'ekonomi',     role: 'employee', support_groups: ['ea', 'nms'],                  earned: 30, saved: 7, used: 11 },
  { id: 'u28', name: 'Karin Wikström',     initials: 'KW', team: 'ekonomi',     role: 'employee', support_groups: ['nms'],                        earned: 30, saved: 3, used: 4 },
  { id: 'u29', name: 'Daniel Söderberg',   initials: 'DS', team: 'ekonomi',     role: 'employee', support_groups: ['reg'],                        earned: 28, saved: 0, used: 2 },

  { id: 'u11', name: 'Lukas Persson',      initials: 'LP', team: 'arbetsplats', role: 'employee', support_groups: ['itsup2', 'klient'],           earned: 25, saved: 0, used: 3 },
  { id: 'u12', name: 'Elin Larsson',       initials: 'EL', team: 'arbetsplats', role: 'employee', support_groups: ['itsup2', 'klient'],           earned: 28, saved: 2, used: 8 },
  { id: 'u13', name: 'Saga Pettersson',    initials: 'SP', team: 'arbetsplats', role: 'employee', support_groups: ['itsup2'],                     earned: 30, saved: 5, used: 6 },
  { id: 'u30', name: 'Henrik Bergqvist',   initials: 'HB', team: 'arbetsplats', role: 'employee', support_groups: ['itsup2', 'klient'],           earned: 30, saved: 1, used: 0 },
  { id: 'u31', name: 'Mikaela Åberg',      initials: 'MÅ', team: 'arbetsplats', role: 'employee', support_groups: ['itsup2'],                     earned: 28, saved: 4, used: 2 },
  { id: 'u32', name: 'Patrik Holmgren',    initials: 'PH', team: 'arbetsplats', role: 'employee', support_groups: ['itsup2', 'klient'],           earned: 30, saved: 2, used: 0 },
  { id: 'u33', name: 'Linda Norström',     initials: 'LL', team: 'arbetsplats', role: 'employee', support_groups: [],                             earned: 30, saved: 6, used: 5 },

  { id: 'u14', name: 'Noah Berg',          initials: 'NB', team: 'mae1',        role: 'employee', support_groups: ['vera', 'itsup2'],             earned: 30, saved: 3, used: 4 },
  { id: 'u15', name: 'Wilma Ek',           initials: 'WE', team: 'mae1',        role: 'employee', support_groups: ['vera'],                       earned: 30, saved: 6, used: 10 },
  { id: 'u16', name: 'Adam Holm',          initials: 'AH', team: 'mae1',        role: 'employee', support_groups: ['vera', 'idm'],                earned: 28, saved: 2, used: 5 },
  { id: 'u17', name: 'Alice Berglund',     initials: 'AB', team: 'mae1',        role: 'employee', support_groups: ['vera', 'idm'],                earned: 30, saved: 4, used: 7 },
  { id: 'u18', name: 'Leo Sjöberg',        initials: 'LS', team: 'mae1',        role: 'employee', support_groups: ['reg'],                        earned: 25, saved: 1, used: 3 },
  { id: 'u34', name: 'Sara Lindgren',      initials: 'SG', team: 'mae1',        role: 'employee', support_groups: [],                             earned: 30, saved: 0, used: 0 },
  { id: 'u35', name: 'Joakim Nordin',      initials: 'JN', team: 'mae1',        role: 'employee', support_groups: ['tfac', 'incid'],              earned: 28, saved: 3, used: 0 },

  { id: 'u19', name: 'Freja Forsberg',     initials: 'FF', team: 'mae2',        role: 'employee', support_groups: ['etj'],                        earned: 30, saved: 5, used: 9 },
  { id: 'u20', name: 'Albin Sandberg',     initials: 'AS', team: 'mae2',        role: 'employee', support_groups: [],                             earned: 28, saved: 3, used: 6 },
  { id: 'u21', name: 'Klara Hellström',    initials: 'KH', team: 'mae2',        role: 'employee', support_groups: ['etj', 'icc'],                 earned: 30, saved: 7, used: 12 },
  { id: 'u22', name: 'Emil Lindström',     initials: 'EM', team: 'mae2',        role: 'employee', support_groups: ['etj'],                        earned: 30, saved: 4, used: 8 },
  { id: 'u36', name: 'Therese Björk',      initials: 'TB', team: 'mae2',        role: 'employee', support_groups: ['tfac'],                       earned: 30, saved: 2, used: 0 },
  { id: 'u37', name: 'Olle Magnusson',     initials: 'OM', team: 'mae2',        role: 'employee', support_groups: [],                             earned: 28, saved: 0, used: 4 },
  { id: 'u38', name: 'Jenny Strömberg',    initials: 'JS', team: 'mae2',        role: 'employee', support_groups: ['reg'],                        earned: 30, saved: 6, used: 0 },
];

let nextReqId = 100;
function R(
  user_id: string,
  start_date: string,
  end_date: string,
  status: VacationRequest['status'],
  opts: Partial<Pick<VacationRequest, 'applied_at' | 'decided_at' | 'decided_by' | 'comment'>> = {}
): VacationRequest {
  return {
    id: 'r' + ++nextReqId,
    user_id,
    start_date,
    end_date,
    days: countDays(start_date, end_date),
    status,
    applied_at: opts.applied_at ?? '2026-04-15',
    decided_at:
      status === 'beviljad' || status === 'avslagen'
        ? opts.decided_at ?? '2026-04-22'
        : null,
    decided_by:
      status === 'beviljad' || status === 'avslagen' ? opts.decided_by ?? 'u01' : null,
    comment: opts.comment ?? null,
  };
}

export const REQUESTS: VacationRequest[] = [
  R('u02', '2026-07-06', '2026-07-24', 'beviljad'),
  R('u03', '2026-07-13', '2026-07-24', 'beviljad'),
  R('u03', '2026-08-10', '2026-08-14', 'ansökt', { applied_at: '2026-05-12' }),
  R('u04', '2026-08-13', '2026-08-14', 'beviljad'),
  R('u24', '2026-07-20', '2026-07-31', 'beviljad'),

  R('u05', '2026-07-20', '2026-08-07', 'beviljad'),
  R('u06', '2026-07-27', '2026-08-07', 'beviljad'),
  R('u07', '2026-06-08', '2026-06-12', 'beviljad'),
  R('u07', '2026-07-13', '2026-07-31', 'beviljad'),
  R('u08', '2026-07-06', '2026-07-24', 'beviljad'),
  R('u08', '2026-08-17', '2026-08-21', 'ansökt', { applied_at: '2026-05-10' }),
  R('u26', '2026-08-03', '2026-08-14', 'ansökt', { applied_at: '2026-05-15' }),

  R('u09', '2026-06-29', '2026-07-10', 'beviljad'),
  R('u09', '2026-08-03', '2026-08-14', 'beviljad'),
  R('u10', '2026-07-13', '2026-07-31', 'beviljad'),
  R('u10', '2026-08-17', '2026-08-21', 'beviljad'),
  R('u28', '2026-07-06', '2026-07-17', 'beviljad'),

  R('u11', '2026-06-15', '2026-07-03', 'beviljad'),
  R('u12', '2026-07-20', '2026-08-07', 'beviljad'),
  R('u13', '2026-07-27', '2026-08-14', 'beviljad'),
  R('u13', '2026-08-17', '2026-08-19', 'ansökt', { applied_at: '2026-05-14', comment: 'Önskar gärna' }),
  R('u30', '2026-07-13', '2026-07-24', 'beviljad'),
  R('u31', '2026-08-10', '2026-08-21', 'ansökt', { applied_at: '2026-05-12' }),

  R('u14', '2026-07-06', '2026-07-17', 'ansökt', { applied_at: '2026-05-15' }),
  R('u14', '2026-08-10', '2026-08-21', 'ansökt', { applied_at: '2026-05-15' }),
  R('u15', '2026-06-29', '2026-07-17', 'beviljad'),
  R('u15', '2026-08-17', '2026-08-21', 'beviljad'),
  R('u16', '2026-07-13', '2026-07-31', 'beviljad'),
  R('u17', '2026-06-08', '2026-06-12', 'beviljad'),
  R('u17', '2026-07-20', '2026-08-07', 'beviljad'),
  R('u18', '2026-07-06', '2026-07-10', 'ansökt', { applied_at: '2026-05-13' }),
  R('u18', '2026-08-10', '2026-08-14', 'utkast'),

  R('u19', '2026-07-27', '2026-08-14', 'beviljad'),
  R('u20', '2026-08-03', '2026-08-14', 'beviljad'),
  R('u20', '2026-06-22', '2026-06-26', 'avslagen', {
    comment: 'Krockar med planerad release, ta gärna v25 istället.',
    applied_at: '2026-04-02',
    decided_at: '2026-04-08',
  }),
  R('u21', '2026-07-06', '2026-07-24', 'beviljad'),
  R('u21', '2026-08-17', '2026-08-21', 'ansökt', { applied_at: '2026-05-11' }),
  R('u22', '2026-07-13', '2026-07-31', 'beviljad'),
  R('u36', '2026-07-20', '2026-08-07', 'ansökt', { applied_at: '2026-05-16' }),
  R('u38', '2026-06-22', '2026-07-03', 'beviljad'),
];

// Support assignments — rotation for v22–v34 of 2026 with intentional gaps so
// the UI shows uncovered days.
let nextAssignId = 1;
function assignRange(
  user_id: string,
  group_id: SupportGroupId,
  startStr: string,
  endStr: string,
  out: SupportAssignment[]
) {
  let d = parse(startStr);
  const end = parse(endStr);
  while (d <= end) {
    if (!isWeekend(d) && !isHoliday(d)) {
      out.push({
        id: 'a' + nextAssignId++,
        user_id,
        group_id,
        date: fmt(d),
      });
    }
    d = addDays(d, 1);
  }
}

function buildAssignments(): SupportAssignment[] {
  const out: SupportAssignment[] = [];
  const A = (u: string, g: SupportGroupId, s: string, e: string) =>
    assignRange(u, g, s, e, out);

  A('u11', 'itsup2', '2026-06-01', '2026-06-12');
  A('u12', 'itsup2', '2026-06-15', '2026-06-26');
  A('u13', 'itsup2', '2026-06-29', '2026-07-10');
  A('u30', 'itsup2', '2026-07-13', '2026-07-24');
  A('u31', 'itsup2', '2026-07-27', '2026-08-07');
  A('u32', 'itsup2', '2026-08-10', '2026-08-21');
  A('u14', 'itsup2', '2026-08-24', '2026-08-30');

  A('u11', 'klient', '2026-06-01', '2026-06-12');
  A('u12', 'klient', '2026-06-15', '2026-06-26');
  A('u30', 'klient', '2026-06-29', '2026-07-10');
  A('u32', 'klient', '2026-07-13', '2026-07-24');
  A('u11', 'klient', '2026-08-03', '2026-08-14');
  A('u30', 'klient', '2026-08-17', '2026-08-28');

  A('u14', 'vera', '2026-06-01', '2026-06-12');
  A('u15', 'vera', '2026-06-15', '2026-07-03');
  A('u16', 'vera', '2026-07-06', '2026-07-17');
  A('u17', 'vera', '2026-07-20', '2026-07-31');
  A('u14', 'vera', '2026-08-03', '2026-08-14');
  A('u16', 'vera', '2026-08-17', '2026-08-28');

  A('u25', 'idm', '2026-06-01', '2026-06-19');
  A('u16', 'idm', '2026-06-22', '2026-07-10');
  A('u17', 'idm', '2026-07-27', '2026-08-14');
  A('u25', 'idm', '2026-08-17', '2026-08-28');

  A('u05', 'soc', '2026-06-01', '2026-06-19');
  A('u06', 'soc', '2026-06-22', '2026-07-17');
  A('u25', 'soc', '2026-07-20', '2026-08-07');
  A('u06', 'soc', '2026-08-17', '2026-08-28');

  A('u07', 'webb', '2026-06-01', '2026-06-19');
  A('u08', 'webb', '2026-06-22', '2026-07-03');
  A('u26', 'webb', '2026-07-06', '2026-07-24');
  A('u08', 'webb', '2026-08-03', '2026-08-28');

  A('u05', 'incid', '2026-06-01', '2026-06-26');
  A('u35', 'incid', '2026-06-29', '2026-07-24');
  A('u05', 'incid', '2026-08-10', '2026-08-28');

  A('u02', 'bered', '2026-06-01', '2026-06-26');
  A('u23', 'bered', '2026-06-29', '2026-07-24');
  A('u03', 'bered', '2026-07-27', '2026-08-14');
  A('u02', 'bered', '2026-08-17', '2026-08-28');

  A('u10', 'nms', '2026-06-01', '2026-07-10');
  A('u28', 'nms', '2026-07-13', '2026-08-07');
  A('u10', 'nms', '2026-08-17', '2026-08-28');

  A('u09', 'ea', '2026-06-01', '2026-06-26');
  A('u10', 'ea', '2026-06-29', '2026-07-31');
  A('u09', 'ea', '2026-08-03', '2026-08-28');

  A('u19', 'etj', '2026-06-01', '2026-06-19');
  A('u21', 'etj', '2026-06-22', '2026-07-10');
  A('u22', 'etj', '2026-07-13', '2026-07-31');
  A('u26', 'etj', '2026-08-03', '2026-08-28');

  A('u27', 'icc', '2026-06-01', '2026-07-10');
  A('u21', 'icc', '2026-07-13', '2026-08-14');
  A('u27', 'icc', '2026-08-24', '2026-08-28');

  A('u02', 'linux', '2026-06-01', '2026-07-03');
  A('u24', 'linux', '2026-07-06', '2026-08-07');
  A('u02', 'linux', '2026-08-10', '2026-08-28');

  A('u23', 'nat', '2026-06-01', '2026-07-17');
  A('u23', 'nat', '2026-08-10', '2026-08-28');

  A('u04', 'dba', '2026-06-01', '2026-08-12');
  A('u04', 'dba', '2026-08-17', '2026-08-28');

  A('u03', 'winsrv', '2026-06-01', '2026-07-10');
  A('u04', 'winsrv', '2026-07-13', '2026-08-12');
  A('u03', 'winsrv', '2026-08-17', '2026-08-28');

  A('u18', 'reg', '2026-06-01', '2026-07-03');
  A('u29', 'reg', '2026-07-06', '2026-07-31');
  A('u38', 'reg', '2026-08-03', '2026-08-28');

  A('u35', 'tfac', '2026-06-01', '2026-07-10');
  A('u36', 'tfac', '2026-07-13', '2026-08-14');
  A('u35', 'tfac', '2026-08-17', '2026-08-28');

  return out;
}

export const SUPPORT_ASSIGNMENTS: SupportAssignment[] = buildAssignments();

// Cross-data helpers
export const membersOfGroup = (employees: Employee[], groupId: SupportGroupId): Employee[] =>
  employees.filter((e) => e.support_groups.includes(groupId));

export const groupsForEmployee = (employees: Employee[], userId: string): SupportGroup[] => {
  const e = employees.find((x) => x.id === userId);
  if (!e) return [];
  return e.support_groups.map((g) => SUPPORT_GROUPS[g]).filter(Boolean);
};

// Re-exports for ease of import
export { mondayOfWeek, addDays, fmt, parse, isWeekend };
