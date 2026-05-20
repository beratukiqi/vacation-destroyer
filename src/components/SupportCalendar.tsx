'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { fmtRangeSv, fmt, parse, addDays, isWeekend, isoWeek } from '@/lib/dates';
import {
  SUPPORT_GROUPS,
  SUPPORT_GROUPS_ORDER,
  TEAMS,
  membersOfGroup,
  isHoliday,
} from '@/lib/data';
import type {
  Employee,
  SupportAssignment,
  SupportGroup,
  SupportGroupId,
  VacationRequest,
} from '@/lib/types';

interface Props {
  employees: Employee[];
  requests: VacationRequest[];
  assignments: SupportAssignment[];
  role: 'chef' | 'employee';
  currentUserId: string;
  search?: string;
  onToggleAssignment: (userId: string, groupId: SupportGroupId, date: string) => void;
}

export function SupportCalendar({
  employees,
  requests,
  assignments,
  role,
  currentUserId,
  search = '',
  onToggleAssignment,
}: Props) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'all' | SupportGroupId>('all');

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const onScroll = () => setStuck(el.getBoundingClientRect().top <= 61);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sommar 2026
  const start = addDays(parse('2026-01-04'), (24 - 1) * 7);
  const end = addDays(start, 11 * 7 - 1);
  const days: Date[] = [];
  let d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  const workDays = days.filter((d) => !isWeekend(d));

  const assignSet = useMemo(() => {
    const m = new Set<string>();
    assignments.forEach((a) =>
      m.add(a.user_id + '|' + a.group_id + '|' + a.date)
    );
    return m;
  }, [assignments]);

  const isAssigned = (userId: string, groupId: SupportGroupId, date: Date) =>
    assignSet.has(userId + '|' + groupId + '|' + fmt(date));

  function vacOn(date: Date, userId: string) {
    const dStr = fmt(date);
    return requests.find(
      (r) =>
        r.user_id === userId &&
        (r.status === 'beviljad' || r.status === 'ansökt') &&
        r.start_date <= dStr &&
        r.end_date >= dStr
    );
  }

  function groupAssignedCount(groupId: SupportGroupId, date: Date) {
    if (isWeekend(date) || isHoliday(date)) return null;
    const members = membersOfGroup(employees, groupId);
    let assigned = 0;
    members.forEach((m) => {
      if (isAssigned(m.id, groupId, date)) assigned++;
    });
    return { total: members.length, assigned };
  }

  function groupRiskDays(groupId: SupportGroupId) {
    return workDays.filter((d) => {
      const c = groupAssignedCount(groupId, d);
      return c && c.assigned === 0;
    });
  }

  const allGroups: SupportGroup[] = SUPPORT_GROUPS_ORDER
    .map((gid) => SUPPORT_GROUPS[gid])
    .filter((g) => membersOfGroup(employees, g.id).length > 0);
  const visibleGroups = allGroups.filter(
    (g) => groupFilter === 'all' || g.id === groupFilter
  );

  const searchTerm = (search || '').trim().toLowerCase();
  const isMatch = (emp: Employee) =>
    !!searchTerm &&
    (emp.name.toLowerCase().includes(searchTerm) ||
      (emp.initials || '').toLowerCase().includes(searchTerm) ||
      (emp.team ? TEAMS[emp.team].name.toLowerCase().includes(searchTerm) : false));

  const totalRiskDays = visibleGroups.reduce(
    (s, g) => s + groupRiskDays(g.id).length,
    0
  );
  const groupsAtRisk = visibleGroups.filter(
    (g) => groupRiskDays(g.id).length > 0
  ).length;

  const weekGroups: { w: number; days: Date[] }[] = [];
  let cur: { w: number; days: Date[] } | null = null;
  workDays.forEach((d) => {
    const w = isoWeek(d);
    if (!cur || cur.w !== w) {
      cur = { w, days: [d] };
      weekGroups.push(cur);
    } else cur.days.push(d);
  });

  const nameCol = '260px';
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
            <div className="h1">Supportkalender</div>
            <div className="sub">
              Visar vem som <strong>tilldelats</strong> support — inte bara vem som är
              tillgänglig.{' '}
              {groupsAtRisk > 0 ? (
                <span style={{ color: 'var(--st-denied-fg)', fontWeight: 500 }}>
                  {groupsAtRisk}{' '}
                  {groupsAtRisk === 1 ? 'grupp' : 'grupper'} obemannade ·{' '}
                  {totalRiskDays} dagar utan tilldelning
                </span>
              ) : (
                <span style={{ color: 'var(--st-approved-fg)', fontWeight: 500 }}>
                  Alla grupper bemannade hela perioden
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
            gap: 14,
            padding: '10px 14px',
            background: 'var(--bg-soft)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <span className="micro">Grupp</span>
          <div className="seg" style={{ padding: 1, flexWrap: 'wrap' }}>
            <button
              className={groupFilter === 'all' ? 'on' : ''}
              onClick={() => setGroupFilter('all')}
            >
              Alla
              {allGroups.some((g) => groupRiskDays(g.id).length > 0) && (
                <span
                  className="risk-dot"
                  title="En eller flera grupper är obemannade"
                />
              )}
            </button>
            {allGroups.map((g) => {
              const riskCount = groupRiskDays(g.id).length;
              return (
                <button
                  key={g.id}
                  className={groupFilter === g.id ? 'on' : ''}
                  onClick={() => setGroupFilter(g.id)}
                  title={`${g.name}${riskCount > 0 ? ` · ${riskCount} ${riskCount === 1 ? 'dag' : 'dagar'} obemannad` : ''}`}
                >
                  {g.short}
                  {riskCount > 0 && (
                    <span className="risk-dot" title={`${riskCount} obemannade dagar`} />
                  )}
                </button>
              );
            })}
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
                  minHeight: 28,
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

        {visibleGroups.map((g) => (
          <SupportGroupSection
            key={g.id}
            group={g}
            members={membersOfGroup(employees, g.id)}
            workDays={workDays}
            gridCols={gridCols}
            groupAssignedCount={groupAssignedCount}
            isAssigned={isAssigned}
            vacOn={vacOn}
            riskCount={groupRiskDays(g.id).length}
            role={role}
            currentUserId={currentUserId}
            onToggleAssignment={onToggleAssignment}
            isMatch={isMatch}
            hasSearch={!!searchTerm}
          />
        ))}
      </div>
    </div>
  );
}

function SupportGroupSection({
  group,
  members,
  workDays,
  gridCols,
  groupAssignedCount,
  isAssigned,
  vacOn,
  riskCount,
  role,
  currentUserId,
  onToggleAssignment,
  isMatch,
  hasSearch,
}: {
  group: SupportGroup;
  members: Employee[];
  workDays: Date[];
  gridCols: string;
  groupAssignedCount: (
    g: SupportGroupId,
    d: Date
  ) => { total: number; assigned: number } | null;
  isAssigned: (uid: string, gid: SupportGroupId, d: Date) => boolean;
  vacOn: (d: Date, uid: string) => VacationRequest | undefined;
  riskCount: number;
  role: 'chef' | 'employee';
  currentUserId: string;
  onToggleAssignment: (uid: string, gid: SupportGroupId, date: string) => void;
  isMatch: (emp: Employee) => boolean;
  hasSearch: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display: 'contents' }}>
      <div
        className="cal-row support-group-row"
        style={{ gridTemplateColumns: gridCols }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="cal-name support-group-name">
          <Icon
            name={collapsed ? 'chevR' : 'chevL'}
            size={12}
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform .12s',
            }}
          />
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {group.name}
          </span>
          <span
            className="mono"
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              padding: '1px 5px',
              background: 'var(--surface)',
              color: 'var(--text-3)',
              borderRadius: 4,
              border: '1px solid var(--border)',
            }}
          >
            {members.length}
          </span>
          {riskCount > 0 && (
            <span
              className="mono"
              title={`${riskCount} dagar utan tilldelning`}
              style={{
                fontSize: 10,
                padding: '1px 5px',
                background: 'var(--st-denied-bg)',
                color: 'var(--st-denied-fg)',
                borderRadius: 4,
                border: '1px solid var(--st-denied-bd)',
              }}
            >
              ⚠ {riskCount}
            </span>
          )}
        </div>
        {workDays.map((d, i) => {
          const ho = isHoliday(d);
          const c = !ho ? groupAssignedCount(group.id, d) : null;
          const ok = c && c.assigned >= 1;
          const indicator = ho
            ? 'transparent'
            : ok
              ? 'transparent'
              : 'var(--st-denied-solid)';
          return (
            <div
              key={i}
              className="cal-cell support-group-cell"
              style={{ ['--indicator' as string]: indicator } as React.CSSProperties}
              title={
                ho
                  ? 'Helgdag'
                  : ok
                    ? `${c?.assigned} tilldelad${c?.assigned !== 1 ? 'a' : ''}`
                    : 'Ingen tilldelad'
              }
            />
          );
        })}
      </div>

      {!collapsed &&
        members.map((e) => {
          const canEdit = role === 'chef' || e.id === currentUserId;
          const matched = isMatch(e);
          const dimmed = hasSearch && !matched;
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
              <div className="cal-name" style={{ paddingLeft: 32 }}>
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
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    background: 'var(--bg-soft)',
                    color: 'var(--text-3)',
                    borderRadius: 4,
                    marginLeft: 'auto',
                  }}
                >
                  {e.team ? TEAMS[e.team].short : '—'}
                </span>
              </div>
              {workDays.map((d, i) => {
                const ho = isHoliday(d);
                if (ho) return <div key={i} className="cal-cell holiday">—</div>;
                const assigned = isAssigned(e.id, group.id, d);
                const v = vacOn(d, e.id);

                let cls = '';
                let label = '';
                let extraStyle: React.CSSProperties | undefined;
                if (assigned) {
                  cls = 's-approved';
                  label = 'S';
                } else if (v && v.status === 'beviljad') {
                  extraStyle = {
                    background:
                      'color-mix(in oklch, var(--st-approved-bg) 40%, var(--bg))',
                    color: 'var(--text-3)',
                    fontWeight: 400,
                    fontSize: 10.5,
                  };
                  label = 'L';
                } else if (v && v.status === 'ansökt') {
                  extraStyle = {
                    background:
                      'color-mix(in oklch, var(--st-pending-bg) 40%, var(--bg))',
                    color: 'var(--text-3)',
                    fontWeight: 400,
                    fontSize: 10.5,
                  };
                  label = 'L?';
                }
                const titleParts = [e.name];
                if (assigned) titleParts.push('Tilldelad ' + group.name);
                if (v)
                  titleParts.push(
                    (v.status === 'beviljad' ? 'Beviljad' : 'Ansökt') +
                      ' semester ' +
                      fmtRangeSv(v.start_date, v.end_date)
                  );
                return (
                  <div
                    key={i}
                    className={'cal-cell ' + cls}
                    style={{ ...extraStyle, cursor: canEdit ? 'pointer' : 'default' }}
                    onClick={
                      canEdit
                        ? () => onToggleAssignment(e.id, group.id, fmt(d))
                        : undefined
                    }
                    title={titleParts.join(' · ')}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
}
