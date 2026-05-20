'use client';

import { useState } from 'react';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { Pill } from './ui/Pill';
import { fmtRangeSv, fmtWeekRange, parse, addDays, isoWeek } from '@/lib/dates';
import { TEAMS } from '@/lib/data';
import type { Employee, VacationRequest } from '@/lib/types';

interface DashboardProps {
  user: Employee;
  employees: Employee[];
  requests: VacationRequest[];
  onNewRequest: () => void;
  onEditRequest: (r: VacationRequest) => void;
  onWithdrawRequest: (id: string) => void;
  onOpenCalendar: () => void;
}

export function EmployeeDashboard({
  user,
  employees,
  requests,
  onNewRequest,
  onEditRequest,
  onWithdrawRequest,
  onOpenCalendar,
}: DashboardProps) {
  return (
    <div className="col" style={{ gap: 'var(--gap)' }}>
      <div className="row between">
        <div className="col" style={{ gap: 2 }}>
          <div className="h1">Hej, {user.name.split(' ')[0]}</div>
          <div className="sub">Här är din semester för 2026.</div>
        </div>
      </div>

      <SaldoCard user={user} requests={requests} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 'var(--gap)',
          alignItems: 'start',
        }}
      >
        <MyRequestsCard
          user={user}
          requests={requests}
          onNew={onNewRequest}
          onEdit={onEditRequest}
          onWithdraw={onWithdrawRequest}
        />
        <TeamSnapshot
          user={user}
          employees={employees}
          requests={requests}
          onOpenCalendar={onOpenCalendar}
        />
      </div>
    </div>
  );
}

function SaldoCard({ user, requests }: { user: Employee; requests: VacationRequest[] }) {
  const used = requests
    .filter((r) => r.user_id === user.id && r.status === 'beviljad')
    .reduce((s, r) => s + r.days, 0);
  const earned = user.earned;
  const saved = user.saved;
  const total = earned + saved;
  const left = total - used;
  const pct = Math.min(100, Math.round((used / total) * 100));

  const stat = (label: string, n: number, hint?: string) => (
    <div className="col" style={{ gap: 2 }}>
      <div className="micro">{label}</div>
      <div
        className="mono"
        style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        {n}
      </div>
      {hint && <div className="micro" style={{ color: 'var(--text-4)' }}>{hint}</div>}
    </div>
  );

  return (
    <div
      className="card card-pad"
      style={{ gap: 18, display: 'flex', flexDirection: 'column' }}
    >
      <div className="row between">
        <div className="col" style={{ gap: 2 }}>
          <div className="h2">Semestersaldo 2026</div>
          <div className="sub">Räknas i hela dagar. Halvdagar hanteras inte.</div>
        </div>
        <span className="pill">
          <Icon name="leaf" size={12} />
          Per 20 maj
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          alignItems: 'end',
        }}
      >
        {stat('Intjänade', earned, 'år 2026')}
        {stat('Sparade', saved, 'från tidigare')}
        {stat('Uttagna', used, 'beviljade')}
        <div
          className="col"
          style={{
            gap: 2,
            padding: '14px 16px',
            background: 'var(--brand-soft)',
            borderRadius: 10,
            border: '1px solid color-mix(in oklch, var(--brand) 25%, var(--border))',
          }}
        >
          <div className="micro" style={{ color: 'var(--brand-2)' }}>Kvarvarande</div>
          <div
            className="mono"
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--brand-2)',
            }}
          >
            {left}
          </div>
          <div className="micro" style={{ color: 'var(--brand-2)' }}>
            dagar att lägga ut
          </div>
        </div>
      </div>

      <div>
        <div className="row between" style={{ marginBottom: 6 }}>
          <div className="micro">Uttaget av totalt {total} dagar</div>
          <div className="micro mono">{pct}%</div>
        </div>
        <div className="progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function MyRequestsCard({
  user,
  requests,
  onNew,
  onEdit,
  onWithdraw,
}: {
  user: Employee;
  requests: VacationRequest[];
  onNew: () => void;
  onEdit: (r: VacationRequest) => void;
  onWithdraw: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<VacationRequest | null>(null);

  const mine = requests
    .filter((r) => r.user_id === user.id)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return (
    <div className="card">
      <div className="card-hd">
        <div className="h2">Mina ansökningar</div>
        <button className="btn btn-primary btn-sm" onClick={onNew}>
          <Icon name="plus" size={14} />
          Ny ansökan
        </button>
      </div>
      {mine.length === 0 ? (
        <div
          className="col"
          style={{
            padding: '28px 16px',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-3)',
          }}
        >
          <div className="h2" style={{ color: 'var(--text-2)' }}>
            Inga ansökningar än
          </div>
          <div className="sub">Skicka in din första semesteransökan för sommaren.</div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 6 }}
            onClick={onNew}
          >
            <Icon name="plus" size={14} />
            Ny ansökan
          </button>
        </div>
      ) : (
        <div>
          {mine.map((r, i) => (
            <RequestRow
              key={r.id}
              r={r}
              divider={i > 0}
              onEdit={() => onEdit(r)}
              onDelete={() => setConfirmDelete(r)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        title={confirmDelete?.status === 'utkast' ? 'Ta bort utkast' : 'Dra tillbaka ansökan'}
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDelete(null)}>
              Avbryt
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirmDelete) onWithdraw(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              {confirmDelete?.status === 'utkast' ? 'Ta bort' : 'Dra tillbaka'}
            </button>
          </>
        }
      >
        {confirmDelete && (
          <div className="sub">
            {confirmDelete.status === 'utkast' ? (
              <>
                Ditt utkast för{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {fmtRangeSv(confirmDelete.start_date, confirmDelete.end_date)}
                </strong>{' '}
                tas bort.
              </>
            ) : (
              <>
                Din ansökan för{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {fmtRangeSv(confirmDelete.start_date, confirmDelete.end_date)} (
                  {confirmDelete.days} d)
                </strong>{' '}
                dras tillbaka.
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function RequestRow({
  r,
  divider,
  onEdit,
  onDelete,
}: {
  r: VacationRequest;
  divider: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canEdit = r.status === 'ansökt' || r.status === 'utkast';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 90px 110px 1fr auto',
        gap: 16,
        alignItems: 'center',
        padding: '14px 16px',
        borderTop: divider ? '1px solid var(--border)' : 'none',
      }}
    >
      <div className="col" style={{ gap: 2 }}>
        <div style={{ fontWeight: 500 }}>{fmtRangeSv(r.start_date, r.end_date)}</div>
        <div className="micro">{fmtWeekRange(r.start_date, r.end_date)} · 2026</div>
      </div>
      <div className="mono" style={{ fontWeight: 500 }}>
        {r.days} {r.days === 1 ? 'dag' : 'dagar'}
      </div>
      <Pill status={r.status} />
      <div className="micro" style={{ color: 'var(--text-3)' }}>
        {r.status === 'utkast' && 'Inte inskickad'}
        {r.status === 'ansökt' && `Inskickad ${r.applied_at}`}
        {r.status === 'beviljad' && `Beviljad ${r.decided_at} av Anna L.`}
        {r.status === 'avslagen' &&
          (r.comment ? `Avslag: "${r.comment}"` : `Avslagen ${r.decided_at}`)}
      </div>
      <div className="row" style={{ gap: 4 }}>
        {canEdit && (
          <button className="btn btn-sm btn-ghost" onClick={onEdit}>
            Redigera
          </button>
        )}
        {canEdit && (
          <button
            className="btn btn-sm btn-ghost"
            style={{ color: 'var(--st-denied-fg)' }}
            onClick={onDelete}
          >
            {r.status === 'utkast' ? 'Ta bort' : 'Dra tillbaka'}
          </button>
        )}
        {r.status === 'beviljad' && (
          <span className="micro" style={{ color: 'var(--text-4)' }}>
            Låst
          </span>
        )}
      </div>
    </div>
  );
}

function TeamSnapshot({
  user,
  employees,
  requests,
  onOpenCalendar,
}: {
  user: Employee;
  employees: Employee[];
  requests: VacationRequest[];
  onOpenCalendar: () => void;
}) {
  const anchorStart = parse('2026-07-13');
  const anchorEnd = addDays(anchorStart, 13);

  const teammates = employees.filter((e) => e.team === user.team && e.id !== user.id);
  const awayBy: Record<string, VacationRequest | undefined> = {};
  teammates.forEach((e) => {
    awayBy[e.id] = requests.find(
      (r) =>
        r.user_id === e.id &&
        (r.status === 'beviljad' || r.status === 'ansökt') &&
        parse(r.end_date) >= anchorStart &&
        parse(r.start_date) <= anchorEnd
    );
  });

  const teamLabel = user.team ? TEAMS[user.team].name : '';

  return (
    <div className="card">
      <div className="card-hd">
        <div className="col" style={{ gap: 2 }}>
          <div className="h2">Ditt team — sommarsemester</div>
          <div className="sub">{teamLabel} · v28–v29</div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={onOpenCalendar}>
          Öppna kalender <Icon name="arrowR" size={13} />
        </button>
      </div>
      <div className="card-bd" style={{ padding: 0 }}>
        {teammates.slice(0, 6).map((e, i) => {
          const r = awayBy[e.id];
          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                padding: '10px 16px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                gap: 14,
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <Avatar name={e.name} initials={e.initials} />
                <div className="col">
                  <div style={{ fontSize: 13.5 }}>{e.name}</div>
                  <div className="micro">
                    {e.support_groups.length > 0
                      ? e.support_groups.slice(0, 2).join(' · ') +
                        (e.support_groups.length > 2
                          ? ` +${e.support_groups.length - 2}`
                          : '')
                      : 'Ingen supportgrupp'}
                  </div>
                </div>
              </div>
              {r ? (
                <span className="micro mono">
                  {fmtRangeSv(r.start_date, r.end_date)}
                </span>
              ) : (
                <span className="micro" style={{ color: 'var(--text-4)' }}>
                  arbetar
                </span>
              )}
              {r ? (
                <Pill status={r.status} />
              ) : (
                <span className="pill" style={{ background: 'var(--bg-soft)' }}>
                  <span className="dot" style={{ background: 'var(--text-4)' }} />
                  Arbetar
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Re-export for type usage elsewhere
export type { Employee, VacationRequest };
// silence unused
void isoWeek;
