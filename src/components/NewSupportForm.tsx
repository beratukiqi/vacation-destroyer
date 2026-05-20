'use client';

import { useState, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import {
  addDays,
  fmt,
  parse,
  isWeekend,
  isoWeek,
  fmtRangeSv,
  fmtWeekRange,
  SV_MONTHS_LONG,
} from '@/lib/dates';
import { HOLIDAYS, isHoliday, SUPPORT_GROUPS, membersOfGroup } from '@/lib/data';
import type {
  Employee,
  SupportAssignment,
  SupportGroupId,
  VacationRequest,
} from '@/lib/types';

interface Range {
  start: Date;
  end: Date;
  days: number;
}

interface Props {
  user: Employee;
  employees: Employee[];
  assignments: SupportAssignment[];
  requests: VacationRequest[];
  onSubmit: (newAssigns: SupportAssignment[]) => void;
  onCancel: () => void;
}

export function NewSupportForm({
  user,
  employees,
  assignments,
  requests,
  onSubmit,
  onCancel,
}: Props) {
  const userGroups = user.support_groups;
  const [groupId, setGroupId] = useState<SupportGroupId | null>(
    userGroups[0] ?? null
  );
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [anchor, setAnchor] = useState({ y: 2026, m: 5 });

  function shiftMonths(delta: number) {
    const total = anchor.y * 12 + anchor.m + delta;
    setAnchor({ y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 });
  }

  const visibleMonths = [0, 1, 2].map((off) => {
    const total = anchor.y * 12 + anchor.m + off;
    return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
  });

  const assignSet = useMemo(() => {
    const m = new Set<string>();
    assignments.forEach((a) =>
      m.add(a.user_id + '|' + a.group_id + '|' + a.date)
    );
    return m;
  }, [assignments]);

  const groupMembers = useMemo(
    () => (groupId ? membersOfGroup(employees, groupId) : []),
    [employees, groupId]
  );

  function countOnDay(d: Date): number {
    if (!groupId) return 0;
    const key = fmt(d);
    let n = 0;
    for (const m of groupMembers) {
      if (assignSet.has(m.id + '|' + groupId + '|' + key)) n++;
    }
    return n;
  }

  function alreadyMine(d: Date): boolean {
    if (!groupId) return false;
    return assignSet.has(user.id + '|' + groupId + '|' + fmt(d));
  }

  function vacOn(d: Date): VacationRequest | undefined {
    const dStr = fmt(d);
    return requests.find(
      (r) =>
        r.user_id === user.id &&
        (r.status === 'beviljad' || r.status === 'ansökt') &&
        r.start_date <= dStr &&
        r.end_date >= dStr
    );
  }

  function toggleDay(d: Date) {
    if (isWeekend(d) || isHoliday(d)) return;
    if (alreadyMine(d)) return;
    const k = fmt(d);
    const next = new Set(selectedDays);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelectedDays(next);
  }

  function toggleWeek(weekdays: Date[]) {
    const valid = weekdays.filter(
      (d) => !isWeekend(d) && !isHoliday(d) && !alreadyMine(d)
    );
    if (valid.length === 0) return;
    const allSelected = valid.every((d) => selectedDays.has(fmt(d)));
    const next = new Set(selectedDays);
    if (allSelected) valid.forEach((d) => next.delete(fmt(d)));
    else valid.forEach((d) => next.add(fmt(d)));
    setSelectedDays(next);
  }

  const ranges = useMemo<Range[]>(() => computeRanges(selectedDays), [selectedDays]);
  const totalDays = ranges.reduce((s, r) => s + r.days, 0);

  const conflictDays = useMemo(() => {
    const out: string[] = [];
    selectedDays.forEach((k) => {
      const d = parse(k);
      if (vacOn(d)) out.push(k);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, requests]);

  const canSubmit = !!groupId && ranges.length > 0;

  function confirmSubmit() {
    if (!groupId) return;
    setSaving(true);
    setTimeout(() => {
      const sorted = [...selectedDays].sort();
      const newAssigns: SupportAssignment[] = sorted.map((date, i) => ({
        id: 'a' + (Date.now() + i),
        user_id: user.id,
        group_id: groupId,
        date,
      }));
      onSubmit(newAssigns);
    }, 200);
  }

  const groupLabel = groupId ? SUPPORT_GROUPS[groupId].name : 'Välj grupp';

  return (
    <div className="col" style={{ gap: 'var(--gap)' }}>
      <div className="row between">
        <div className="col" style={{ gap: 2 }}>
          <div className="h1">Lägg till support</div>
          <div className="sub">
            Välj supportgrupp och dagar du vill ta. Siffran i varje dag visar hur
            många i gruppen som redan är inbokade.
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={onCancel}>
            Avbryt
          </button>
          <button
            className={`btn ${canSubmit ? 'btn-primary' : ''}`}
            disabled={!canSubmit || saving}
            style={!canSubmit ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
            onClick={() => setConfirmOpen(true)}
          >
            Granska
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 'var(--gap)',
          alignItems: 'start',
        }}
      >
        <div className="card">
          <div className="card-hd">
            <div className="col" style={{ gap: 2 }}>
              <div className="h2">Välj datum</div>
              <div className="sub">
                {groupId
                  ? `Visar belastning för ${SUPPORT_GROUPS[groupId].short} (${groupMembers.length} i gruppen)`
                  : 'Välj en supportgrupp till höger för att se belastning.'}
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button
                className="btn btn-icon"
                onClick={() => shiftMonths(-3)}
                aria-label="Tidigare månader"
              >
                <Icon name="chevL" size={16} />
              </button>
              <div
                className="mono"
                style={{
                  fontSize: 12.5,
                  padding: '0 10px',
                  minWidth: 110,
                  textAlign: 'center',
                  color: 'var(--text-2)',
                  fontWeight: 500,
                }}
              >
                {monthLabel(visibleMonths[0])} – {monthLabel(visibleMonths[2])}
              </div>
              <button
                className="btn btn-icon"
                onClick={() => shiftMonths(3)}
                aria-label="Senare månader"
              >
                <Icon name="chevR" size={16} />
              </button>
            </div>
          </div>

          <div
            className="card-bd"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 22,
            }}
          >
            {visibleMonths.map(({ y, m }) => (
              <MonthGrid
                key={`${y}-${m}`}
                year={y}
                month={m}
                selected={selectedDays}
                countOnDay={countOnDay}
                alreadyMine={alreadyMine}
                hasVac={(d) => !!vacOn(d)}
                onToggleDay={toggleDay}
                onToggleWeek={toggleWeek}
                groupSelected={!!groupId}
              />
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 'var(--gap)' }}>
          <div
            className="card card-pad"
            style={{ gap: 12, display: 'flex', flexDirection: 'column' }}
          >
            <div className="h2">Supportgrupp</div>
            {userGroups.length === 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--st-pending-bg)',
                  border: '1px solid var(--st-pending-bd)',
                  borderRadius: 8,
                  color: 'var(--st-pending-fg)',
                  fontSize: 12.5,
                }}
              >
                Du tillhör ingen supportgrupp. Be din chef att lägga till dig i en
                grupp först.
              </div>
            ) : (
              <div className="col" style={{ gap: 6 }}>
                {userGroups.map((gid) => {
                  const g = SUPPORT_GROUPS[gid];
                  const active = groupId === gid;
                  return (
                    <div
                      key={gid}
                      onClick={() => setGroupId(gid)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: active
                          ? '1px solid color-mix(in oklch, var(--brand) 35%, var(--border))'
                          : '1px solid var(--border)',
                        background: active ? 'var(--brand-soft)' : 'var(--bg-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        cursor: 'default',
                      }}
                    >
                      <div className="col" style={{ gap: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 500,
                            color: active ? 'var(--brand-2)' : 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {g.name}
                        </div>
                        <div className="micro">
                          {membersOfGroup(employees, gid).length} i gruppen
                        </div>
                      </div>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10.5,
                          padding: '2px 6px',
                          background: active ? 'var(--brand)' : 'var(--surface)',
                          color: active ? '#fff' : 'var(--text-3)',
                          border: active
                            ? '1px solid var(--brand-2)'
                            : '1px solid var(--border)',
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {g.short}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="card card-pad"
            style={{ gap: 14, display: 'flex', flexDirection: 'column' }}
          >
            <div className="h2">Sammanfattning</div>
            {ranges.length === 0 ? (
              <div className="sub">Inga datum valda än.</div>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {ranges.map((rg, i) => (
                  <div
                    key={i}
                    className="row between"
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-soft)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="col" style={{ gap: 2 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                        {fmtRangeSv(fmt(rg.start), fmt(rg.end))}
                      </div>
                      <div className="micro">
                        {fmtWeekRange(fmt(rg.start), fmt(rg.end))}
                      </div>
                    </div>
                    <div className="mono" style={{ fontWeight: 500 }}>
                      {rg.days} d
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="divider" style={{ margin: 0 }} />

            <div className="row between">
              <div className="micro">Totalt</div>
              <div className="mono" style={{ fontWeight: 600, fontSize: 15 }}>
                {totalDays} {totalDays === 1 ? 'dag' : 'dagar'}
              </div>
            </div>

            {conflictDays.length > 0 && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--st-pending-bg)',
                  border: '1px solid var(--st-pending-bd)',
                  borderRadius: 8,
                  color: 'var(--st-pending-fg)',
                  fontSize: 12.5,
                }}
              >
                Obs! {conflictDays.length}{' '}
                {conflictDays.length === 1 ? 'dag krockar' : 'dagar krockar'} med
                din semester.
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Bekräfta support"
        onClose={() => !saving && setConfirmOpen(false)}
        footer={
          <>
            <button
              className="btn"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Tillbaka
            </button>
            <button
              className="btn btn-primary"
              onClick={confirmSubmit}
              disabled={saving}
            >
              {saving ? 'Sparar…' : 'Bekräfta'}
            </button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <div className="sub">
            Du lägger till dig själv på support — ingen chef behöver godkänna.
          </div>

          <div className="col" style={{ gap: 6 }}>
            <div className="h3">Grupp</div>
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--brand-soft)',
                borderRadius: 8,
                border:
                  '1px solid color-mix(in oklch, var(--brand) 25%, var(--border))',
                fontWeight: 500,
              }}
            >
              {groupLabel}
            </div>
          </div>

          <div className="col" style={{ gap: 6 }}>
            <div className="h3">Period</div>
            <div className="col" style={{ gap: 6 }}>
              {ranges.map((rg, i) => (
                <div
                  key={i}
                  className="row between"
                  style={{
                    padding: '10px 12px',
                    background: 'var(--brand-soft)',
                    borderRadius: 8,
                    border:
                      '1px solid color-mix(in oklch, var(--brand) 25%, var(--border))',
                  }}
                >
                  <div className="col" style={{ gap: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {fmtRangeSv(fmt(rg.start), fmt(rg.end))}
                    </div>
                    <div className="micro">
                      {fmtWeekRange(fmt(rg.start), fmt(rg.end))}
                    </div>
                  </div>
                  <div
                    className="mono"
                    style={{ fontWeight: 600, color: 'var(--brand-2)' }}
                  >
                    {rg.days} {rg.days === 1 ? 'dag' : 'dagar'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="col"
            style={{
              gap: 2,
              padding: '10px 12px',
              background: 'var(--bg-soft)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <div className="micro">Totalt</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
              {totalDays} {totalDays === 1 ? 'dag' : 'dagar'}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function computeRanges(selectedDays: Set<string>): Range[] {
  const days = [...selectedDays].sort().map((s) => parse(s));
  if (days.length === 0) return [];
  const out: { start: Date; end: Date }[] = [];
  let cur = { start: days[0], end: days[0] };
  for (let i = 1; i < days.length; i++) {
    let cursor = addDays(cur.end, 1);
    while (cursor < days[i] && (isWeekend(cursor) || isHoliday(cursor))) {
      cursor = addDays(cursor, 1);
    }
    if (fmt(cursor) === fmt(days[i])) {
      cur.end = days[i];
    } else {
      out.push(cur);
      cur = { start: days[i], end: days[i] };
    }
  }
  out.push(cur);
  return out.map((r) => {
    let n = 0;
    let d = new Date(r.start);
    while (d <= r.end) {
      if (!isWeekend(d) && !isHoliday(d)) n++;
      d = addDays(d, 1);
    }
    return { ...r, days: n };
  });
}

function monthLabel({ y, m }: { y: number; m: number }) {
  return SV_MONTHS_LONG[m].slice(0, 3) + ' ' + String(y).slice(2);
}

function MonthGrid({
  year,
  month,
  selected,
  countOnDay,
  alreadyMine,
  hasVac,
  onToggleDay,
  onToggleWeek,
  groupSelected,
}: {
  year: number;
  month: number;
  selected: Set<string>;
  countOnDay: (d: Date) => number;
  alreadyMine: (d: Date) => boolean;
  hasVac: (d: Date) => boolean;
  onToggleDay: (d: Date) => void;
  onToggleWeek: (weekdays: Date[]) => void;
  groupSelected: boolean;
}) {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);

  const weekRows: { weekNum: number | null; days: (Date | null)[] }[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const wDays = cells.slice(i, i + 7);
    const ref = wDays.find((x): x is Date => x !== null) ?? null;
    weekRows.push({
      weekNum: ref ? isoWeek(ref) : null,
      days: wDays,
    });
  }

  const monthName = SV_MONTHS_LONG[month];

  return (
    <div className="col" style={{ gap: 6 }}>
      <div
        className="h3"
        style={{
          textTransform: 'capitalize',
          letterSpacing: 0,
          color: 'var(--text)',
        }}
      >
        {monthName} {year}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '34px repeat(7, 1fr)',
          gap: 2,
        }}
      >
        <div />
        {['m', 't', 'o', 't', 'f', 'l', 's'].map((d, i) => (
          <div
            key={i}
            className="micro"
            style={{
              textAlign: 'center',
              padding: '2px 0',
              color: i >= 5 ? 'var(--text-4)' : 'var(--text-3)',
            }}
          >
            {d}
          </div>
        ))}

        {weekRows.map((row, ri) => {
          const weekdays = row.days
            .slice(0, 5)
            .filter((d): d is Date => d !== null);
          const validWorkDays = weekdays.filter(
            (d) => !isWeekend(d) && !isHoliday(d) && !alreadyMine(d)
          );
          const allSelected =
            validWorkDays.length > 0 &&
            validWorkDays.every((d) => selected.has(fmt(d)));

          return (
            <div key={ri} style={{ display: 'contents' }}>
              {row.weekNum != null ? (
                <div
                  onClick={() =>
                    validWorkDays.length > 0 && onToggleWeek(weekdays)
                  }
                  title={
                    validWorkDays.length > 0
                      ? `Klicka för att välja hela v${row.weekNum}`
                      : ''
                  }
                  style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10.5,
                    fontFamily: 'Geist Mono, monospace',
                    fontWeight: 600,
                    borderRadius: 5,
                    background: allSelected
                      ? 'var(--brand)'
                      : validWorkDays.length === 0
                        ? 'transparent'
                        : 'var(--brand-soft)',
                    color: allSelected
                      ? '#fff'
                      : validWorkDays.length === 0
                        ? 'var(--text-4)'
                        : 'var(--brand-2)',
                    cursor: validWorkDays.length > 0 ? 'default' : 'not-allowed',
                    opacity: validWorkDays.length === 0 ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  v.{row.weekNum}
                </div>
              ) : (
                <div />
              )}

              {row.days.map((d, di) => {
                if (!d) return <div key={di} />;
                const k = fmt(d);
                const isSel = selected.has(k);
                const we = isWeekend(d);
                const ho = isHoliday(d);
                const mine = alreadyMine(d);
                const vac = hasVac(d);
                const dis = we || ho || mine;
                const count = !we && !ho && groupSelected ? countOnDay(d) : null;
                const showCount = count != null;
                const isZero = showCount && count === 0;

                let bg: string;
                let color: string;
                if (isSel) {
                  bg = 'var(--brand)';
                  color = '#fff';
                } else if (mine) {
                  bg = 'var(--st-approved-bg)';
                  color = 'var(--st-approved-fg)';
                } else if (ho) {
                  bg = 'var(--holiday-bg)';
                  color = 'var(--holiday-fg)';
                } else if (we) {
                  bg = 'var(--bg-soft)';
                  color = 'var(--text-4)';
                } else {
                  bg = 'transparent';
                  color = 'var(--text)';
                }

                const title = mine
                  ? `Du är redan inbokad ${k}`
                  : ho
                    ? HOLIDAYS.find((h) => h.date === k)?.name ?? ''
                    : vac
                      ? 'Du har semester den här dagen'
                      : showCount
                        ? `${count} på support ${k}`
                        : '';

                return (
                  <div
                    key={di}
                    onClick={() => onToggleDay(d)}
                    style={{
                      height: 40,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0,
                      fontSize: 12.5,
                      fontFamily: 'Geist Mono, monospace',
                      borderRadius: 6,
                      background: bg,
                      color,
                      fontWeight: isSel || mine ? 600 : 400,
                      cursor: dis ? 'not-allowed' : 'default',
                      opacity: dis && !isSel && !mine ? 0.7 : 1,
                      position: 'relative',
                      border: vac && !isSel && !mine
                        ? '1px dashed var(--st-pending-bd)'
                        : '1px solid transparent',
                    }}
                    title={title}
                  >
                    <div style={{ lineHeight: 1 }}>{d.getDate()}</div>
                    {showCount && (
                      <div
                        style={{
                          fontSize: 9,
                          lineHeight: 1,
                          marginTop: 2,
                          fontWeight: 600,
                          color: isSel
                            ? 'rgba(255,255,255,0.85)'
                            : mine
                              ? 'var(--st-approved-fg)'
                              : isZero
                                ? 'var(--st-denied-fg)'
                                : 'var(--text-3)',
                        }}
                      >
                        {count}p
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
