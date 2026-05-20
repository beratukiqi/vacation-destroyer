// Domain types for the semester app.

export type TeamId =
  | 'itdir'
  | 'datacenter'
  | 'digital'
  | 'ekonomi'
  | 'arbetsplats'
  | 'mae1'
  | 'mae2';

export interface Team {
  id: TeamId;
  name: string;
  short: string;
}

export type SupportGroupId =
  | 'tfac' | 'itsup2' | 'bered' | 'klient' | 'idm' | 'incid' | 'soc'
  | 'vera' | 'webb' | 'nms' | 'ea' | 'etj' | 'icc'
  | 'linux' | 'nat' | 'dba' | 'winsrv' | 'reg';

export interface SupportGroup {
  id: SupportGroupId;
  name: string;
  short: string;
}

export type Role = 'employee' | 'chef';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  email?: string;
  team: TeamId | '';
  role: Role;
  support_groups: SupportGroupId[];
  earned: number;
  saved: number;
  used: number;
}

export type RequestStatus = 'utkast' | 'ansökt' | 'beviljad' | 'avslagen';

export interface VacationRequest {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  days: number;
  status: RequestStatus;
  applied_at: string;
  decided_at: string | null;
  decided_by: string | null;
  comment: string | null;
}

export interface SupportAssignment {
  id: string;
  user_id: string;
  group_id: SupportGroupId;
  date: string; // YYYY-MM-DD
}

export interface Holiday {
  date: string;
  name: string;
}
