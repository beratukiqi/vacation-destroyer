'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { fmtRangeSv, fmt, parse, addDays, isWeekend, isoWeek } from '@/lib/dates';
import { TEAMS, TEAM_ORDER, isHoliday } from '@/lib/data';
import type { Employee, VacationRequest } from '@/lib/types';

interface Props {
  employees: Employee[];
  requests: VacationRequest[];
  search?: string;
}

export function ManagerCalendar({ employees, requests, search = '' }: Props) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [team, setTeam] = useState<'all' | string>('all');

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const onScroll = () => setStuck(el.getBoundingClientRect().top <= 61);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const searchTerm = (search || '').trim().toLowerCase();
  const visibleEmployees = useMemo(() => {
    let list = employees.filter((e) => e.role === 'employee');
    if (team !== 'all') list = list.filter((e) => e.team === team);
    return list;
  }, [employees, team]);

  function isMatch(emp: Employee) {
    if (!searchTerm) return false;
    return (
      emp.name.toLowerCase().includes(searchTerm) ||
      (emp.initials || '').toLowerCase().includes(searchTerm) ||
      (emp.team ? TEAMS[emp.team].name.toLowerCase().includes(searchTerm) : false)
    );
  }
  const matchCount = searchTerm ? visibleEmployees.filter(isMatch).length : 0;

  // Sommar 2026 — v24 to v34
  const start = addDays(parse('2026-01-04'), (24 - 1) * 7);
  const end = addDays(start, 11 * 7 - 1);
  const days: Date[] = [];
  let d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  const workDays = days.filter((d) => !isWeekend(d));

  function reqOn(date: Date, userId: string) {
    const dStr = fmt(date);
    return requests.find(
      (r) => r.user_id === userId && r.start_date <= dStr && r.end_date >= dStr
    );
  }

  const weekGroups: { w: number; days: Date[] }[] = [];
  let cur: { w: number; days: Date[] } | null = null;
  workDays.forEach((d) => {
    const w = isoWeek(d);
    if (!cur || cur.w !== w) {
      cur = { w, days: [d] };
      weekGroups.push(cur);
    } else cur.days.push(d);
  });

  const teamGroups = TEAM_ORDER.map((tid) => ({
    team: TEAMS[tid],
    members: visibleEmployees.filter((e) => e.team === tid),
  })).filter((g) => g.members.length > 0);

  const nameCol = '200px';
  const dayCol = 'minmax(34px, 1fr)';
  const gridCols = `${nameCol} ${workDays.map(() => dayCol).join(' ')}`;

  return (
    <div className="col" style={{ gap: 'var(--gap)' }}>
      <div
        ref={stickyRef}
        className={'sticky-section' + (stuck ? ' is-stuck' : '')}
      >
        <div className="row between">
          <div className="col" style={{ gap: 2 }}>
            <div className="h1">Översiktskalender</div>
            <div className="sub">
              Semesterledighet · {visibleEmployees.length}{' '}
              {visibleEmployees.length === 1 ? 'person' : 'personer'}
              {searchTerm && (
                <span
                  style={{
                    color: matchCount > 0 ? 'var(--brand-2)' : 'var(--text-3)',
                    fontWeight: 500,
                  }}
                >
                  {' · '}
                  {matchCount} {matchCount === 1 ? 'träff' : 'träffar'} på "{search}"
                </span>
              )}
            </div>
          </div>
          <span
            className="pill"
            style={{
              background: 'var(--brand-soft)',
              color: 'var(--brand-2)',
              borderColor: 'color-mix(in oklch, var(--brand) 30%, var(--border))',
              padding: '4px 12px',
              fontWeight: 500,
            }}
          >
            Sommar 2026 · v24–v34
          </span>
        </div>

        <div
          className="row"
          style={{
            gap: 10,
            padding: '10px 14px',
            background: 'var(--bg-soft)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <Icon name="filter" size={14} />
          <span className="micro">Team</span>
          <div className="seg" style={{ padding: 1 }}>
            <button className={team === 'all' ? 'on' : ''} onClick={() => setTeam('all')}>
              Alla
            </button>
            {TEAM_ORDER.map((tid) => (
              <button
                key={tid}
                className={team === tid ? 'on' : ''}
                onClick={() => setTeam(tid)}
              >
                {TEAMS[tid].short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cal-grid">
        <div
          className="cal-row cal-hd cal-hd-week"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div
            className="cal-name"
            style={{ fontWeight: 600, color: 'var(--text-2)' }}
          >
            Vecka
          </div>
          {weekGroups.map((g) => (
            <div
              key={g.w}
              style={{
                gridColumn: `span ${g.days.length}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid var(--border)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-2)',
                minHeight: 24,
                background: 'var(--bg-soft)',
                letterSpacing: '0.04em',
              }}
            >
              v{g.w}
            </div>
          ))}
        </div>

        <div
          className="cal-row cal-hd cal-hd-day"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="cal-name" />
          {workDays.map((d, i) => {
            const ho = isHoliday(d);
            return (
              <div
                key={i}
                className={'cal-cell' + (ho ? ' holiday' : '')}
                style={{
                  fontSize: 10.5,
                  minHeight: 24,
                  flexDirection: 'column',
                  gap: 0,
                  padding: '2px 0',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: ho ? 'var(--holiday-fg)' : 'var(--text-3)',
                  }}
                >
                  {['m', 't', 'o', 't', 'f'][(d.getDay() + 6) % 7]}
                </div>
                <div className="mono" style={{ fontSize: 10 }}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {teamGroups.map((g) => (
          <div key={g.team.id} style={{ display: 'contents' }}>
            <div
              className="cal-row cal-row-team-header"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="cal-name cal-team-name">{g.team.name}</div>
              <div
                className="cal-team-fill"
                style={{ gridColumn: `span ${workDays.length}` }}
              />
            </div>
            {g.members.map((e) => {
              const matched = isMatch(e);
              const dimmed = !!searchTerm && !matched;
              return (
                <div
                  key={e.id}
                  className={
                    'cal-row' +
                    (matched ? ' cal-row-match' : '') +
                    (dimmed ? ' cal-row-dim' : '')
                  }
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="cal-name">
                    <Avatar name={e.name} initials={e.initials} size={22} />
                    <span
                      style={{
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {e.name}
                    </span>
                  </div>
                  {workDays.map((d, i) => {
                    const r = reqOn(d, e.id);
                    const ho = isHoliday(d);
                    let cls = '';
                    let label = '';
                    if (r) {
                      if (r.status === 'beviljad') {
                        cls = 's-approved';
                        label = 'L';
                      } else if (r.status === 'ansökt') {
                        cls = 's-pending';
                        label = 'L?';
                      } else if (r.status === 'avslagen') {
                        cls = 's-denied';
                        label = '✕';
                      }
                    }
                    if (ho) cls = 'holiday';
                    return (
                      <div
                        key={i}
                        className={'cal-cell ' + cls}
                        title={
                          r
                            ? `${e.name} · ${r.status} · ${fmtRangeSv(
                                r.start_date,
                                r.end_date
                              )}`
                            : ''
                        }
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
