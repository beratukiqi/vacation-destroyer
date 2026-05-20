'use client';

import { useState, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { addDays, fmt, parse, isWeekend, isoWeek, mondayOfWeek, fmtRangeSv, fmtWeekRange, SV_MONTHS_LONG } from '@/lib/dates';
import { HOLIDAYS, isHoliday, countDays } from '@/lib/data';
import type { Employee, VacationRequest } from '@/lib/types';

interface Range {
  start: Date;
  end: Date;
  days: number;
}

interface Props {
  user: Employee;
  requests: VacationRequest[];
  editing: VacationRequest | null;
  onSubmit: (newReqs: VacationRequest[], replaceId: string | null) => void;
  onCancel: () => void;
}

export function NewRequestForm({ user, requests, editing, onSubmit, onCancel }: Props) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(() => {
    if (!editing) return new Set();
    const set = new Set<string>();
    let d = parse(editing.start_date);
    const end = parse(editing.end_date);
    while (d <= end) {
      if (!isWeekend(d) && !isHoliday(d)) set.add(fmt(d));
      d = addDays(d, 1);
    }
    return set;
  });
  const [comment, setComment] = useState(editing?.comment ?? '');
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

  function toggleDay(d: Date) {
    const k = fmt(d);
    if (isWeekend(d) || isHoliday(d)) return;
    const next = new Set(selectedDays);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelectedDays(next);
  }

  function toggleWeek(weekdays: Date[]) {
    const valid = weekdays.filter((d) => !isWeekend(d) && !isHoliday(d));
    const allSelected = valid.every((d) => selectedDays.has(fmt(d)));
    const next = new Set(selectedDays);
    if (allSelected) valid.forEach((d) => next.delete(fmt(d)));
    else valid.forEach((d) => next.add(fmt(d)));
    setSelectedDays(next);
  }

  const ranges = useMemo<Range[]>(() => computeRanges(selectedDays), [selectedDays]);
  const totalDays = ranges.reduce((s, r) => s + r.days, 0);
  const earned = user.earned + user.saved;
  const usedNow = requests
    .filter((r) => r.user_id === user.id && r.status === 'beviljad')
    .reduce((s, r) => s + r.days, 0);
  const editingDays = editing && editing.status === 'beviljad' ? editing.days : 0;
  const remaining = earned - usedNow + editingDays;
  const exceeds = totalDays > remaining;
  const canSubmit = ranges.length > 0 && !exceeds;

  function confirmSubmit() {
    setSaving(true);
    setTimeout(() => {
      const newReqs: VacationRequest[] = ranges.map((rg, i) => ({
        id: editing && i === 0 ? editing.id : 'r' + (Date.now() + i),
        user_id: user.id,
        start_date: fmt(rg.start),
        end_date: fmt(rg.end),
        days: rg.days,
        status: 'ansökt',
        applied_at: '2026-05-20',
        decided_at: null,
        decided_by: null,
        comment: comment || null,
      }));
      onSubmit(newReqs, editing ? editing.id : null);
    }, 200);
  }

  return (
    <div className="col" style={{ gap: 'var(--gap)' }}>
      <div className="row between">
        <div className="col" style={{ gap: 2 }}>
          <div className="h1">{editing ? 'Redigera ansökan' : 'Ny semesteransökan'}</div>
          <div className="sub">
            Klicka på dagar för att välja. Klicka på{' '}
            <span
              className="mono"
              style={{
                padding: '1px 6px',
                background: 'var(--brand-soft)',
                color: 'var(--brand-2)',
                borderRadius: 4,
              }}
            >
              v.NN
            </span>{' '}
            för att välja hela veckan. Helger och röda dagar räknas inte.
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
            {editing ? 'Granska ändring' : 'Granska ansökan'}
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
              <div className="sub">3 månader visas åt gången</div>
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
                onToggleDay={toggleDay}
                onToggleWeek={toggleWeek}
              />
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 'var(--gap)' }}>
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
                      <div className="micro">{fmtWeekRange(fmt(rg.start), fmt(rg.end))}</div>
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
            <div className="row between">
              <div className="micro">Kvar efter ansökan</div>
              <div
                className="mono"
                style={{
                  fontWeight: 500,
                  color: exceeds ? 'var(--st-denied-fg)' : 'var(--text)',
                }}
              >
                {remaining - totalDays} av {earned}
              </div>
            </div>

            {exceeds && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--st-denied-bg)',
                  border: '1px solid var(--st-denied-bd)',
                  borderRadius: 8,
                  color: 'var(--st-denied-fg)',
                  fontSize: 12.5,
                }}
              >
                Du har valt fler dagar än du har kvar att lägga ut.
              </div>
            )}
          </div>

          <div
            className="card card-pad"
            style={{ gap: 8, display: 'flex', flexDirection: 'column' }}
          >
            <div className="h3">Kommentar till chef (valfri)</div>
            <textarea
              className="input textarea"
              placeholder="T.ex. behöver söka i god tid p.g.a. bröllop"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title={editing ? 'Bekräfta ändring' : 'Bekräfta ansökan'}
        onClose={() => !saving && setConfirmOpen(false)}
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Tillbaka
            </button>
            <button className="btn btn-primary" onClick={confirmSubmit} disabled={saving}>
              {saving
                ? 'Skickar…'
                : editing
                  ? 'Spara ändring'
                  : 'Skicka in ansökan'}
            </button>
          </>
        }
      >
        <div className="col" style={{ gap: 14 }}>
          <div className="sub">
            {editing
              ? 'Din ändrade ansökan skickas in på nytt och chef behöver fatta beslut.'
              : <>Din ansökan skickas till <strong style={{color: 'var(--text)'}}>Anna Lindqvist</strong>. Du får besked när beslut är fattat.</>}
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
                    <div className="micro">{fmtWeekRange(fmt(rg.start), fmt(rg.end))}</div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
              <div className="micro">Saldo efter</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
                {remaining - totalDays} av {earned}
              </div>
            </div>
          </div>

          {comment && (
            <div className="col" style={{ gap: 6 }}>
              <div className="h3">Kommentar till chef</div>
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-soft)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text-2)',
                  borderLeft: '3px solid var(--border-strong)',
                }}
              >
                {comment}
              </div>
            </div>
          )}
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
  return out.map((r) => ({
    ...r,
    days: countDays(fmt(r.start), fmt(r.end)),
  }));
}

function monthLabel({ y, m }: { y: number; m: number }) {
  return SV_MONTHS_LONG[m].slice(0, 3) + ' ' + String(y).slice(2);
}

function MonthGrid({
  year,
  month,
  selected,
  onToggleDay,
  onToggleWeek,
}: {
  year: number;
  month: number;
  selected: Set<string>;
  onToggleDay: (d: Date) => void;
  onToggleWeek: (weekdays: Date[]) => void;
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
            (d) => !isWeekend(d) && !isHoliday(d)
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
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
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
                const dis = we || ho;
                return (
                  <div
                    key={di}
                    onClick={() => onToggleDay(d)}
                    style={{
                      height: 32,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12.5,
                      fontFamily: 'Geist Mono, monospace',
                      borderRadius: 6,
                      background: isSel
                        ? 'var(--brand)'
                        : ho
                          ? 'var(--holiday-bg)'
                          : we
                            ? 'var(--bg-soft)'
                            : 'transparent',
                      color: isSel
                        ? '#fff'
                        : ho
                          ? 'var(--holiday-fg)'
                          : we
                            ? 'var(--text-4)'
                            : 'var(--text)',
                      fontWeight: isSel ? 600 : 400,
                      cursor: dis ? 'not-allowed' : 'default',
                      opacity: dis && !isSel ? 0.7 : 1,
                    }}
                    title={
                      ho
                        ? HOLIDAYS.find((h) => h.date === k)?.name ?? ''
                        : ''
                    }
                  >
                    {d.getDate()}
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

void mondayOfWeek;
