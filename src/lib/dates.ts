// Date / week / staffing helpers — pure functions, no React.

import type { Holiday } from './types';

export const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

export const fmt = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parse = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const isWeekend = (d: Date): boolean => {
  const w = d.getDay();
  return w === 0 || w === 6;
};

export const makeIsHoliday = (holidays: Holiday[]) => (d: Date): boolean =>
  holidays.some((h) => h.date === fmt(d));

export const isoWeek = (d: Date): number => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dn = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dn + 3);
  const fw = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      ((t.getTime() - fw.getTime()) / 86400000 - 3 + ((fw.getUTCDay() + 6) % 7)) / 7
    )
  );
};

export const mondayOfWeek = (year: number, week: number): Date => {
  const jan4 = new Date(year, 0, 4);
  const dn = (jan4.getDay() + 6) % 7;
  const mondayW1 = addDays(jan4, -dn);
  return addDays(mondayW1, (week - 1) * 7);
};

export const countDays =
  (isHoliday: (d: Date) => boolean) =>
  (startStr: string, endStr: string): number => {
    let d = parse(startStr);
    const end = parse(endStr);
    let n = 0;
    while (d <= end) {
      if (!isWeekend(d) && !isHoliday(d)) n++;
      d = addDays(d, 1);
    }
    return n;
  };

export const SV_MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];

export const SV_MONTHS_LONG = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

export function fmtRangeSv(startStr: string, endStr: string): string {
  const a = parse(startStr);
  const b = parse(endStr);
  const sameMonth =
    a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (startStr === endStr) return `${a.getDate()} ${SV_MONTHS[a.getMonth()]}`;
  if (sameMonth) return `${a.getDate()}–${b.getDate()} ${SV_MONTHS[a.getMonth()]}`;
  return `${a.getDate()} ${SV_MONTHS[a.getMonth()]} – ${b.getDate()} ${SV_MONTHS[b.getMonth()]}`;
}

export function fmtWeekRange(startStr: string, endStr: string): string {
  const a = parse(startStr);
  const b = parse(endStr);
  const wa = isoWeek(a);
  const wb = isoWeek(b);
  if (wa === wb) return `v${wa}`;
  return `v${wa}–${wb}`;
}
