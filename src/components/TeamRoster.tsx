'use client';

import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { Pill } from './ui/Pill';
import { SUPPORT_GROUPS, TEAM_ORDER, TEAMS } from '@/lib/data';
import type { Employee, VacationRequest } from '@/lib/types';

interface Props {
  employees: Employee[];
  requests: VacationRequest[];
  onAdd: () => void;
  onEdit: (e: Employee) => void;
}

export function TeamRoster({ employees, requests, onAdd, onEdit }: Props) {
  const groups = TEAM_ORDER.map((tid) => ({
    team: TEAMS[tid],
    members: employees.filter((e) => e.team === tid),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="col" style={{ gap: 'var(--gap)' }}>
      <div className="row between">
        <div className="col" style={{ gap: 2 }}>
          <div className="h1">Anställda</div>
          <div className="sub">
            {employees.filter((e) => e.role === 'employee').length} personer i{' '}
            {groups.length} enheter.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <Icon name="plus" size={14} /> Ny anställd
        </button>
      </div>

      {groups.map((g) => (
        <div key={g.team.id} className="card">
          <div className="card-hd">
            <div className="row" style={{ gap: 10 }}>
              <span
                className="pill"
                style={{
                  background: 'var(--brand-soft)',
                  color: 'var(--brand-2)',
                  borderColor: 'color-mix(in oklch, var(--brand) 30%, var(--border))',
                }}
              >
                {g.team.short}
              </span>
              <div className="h2">{g.team.name}</div>
            </div>
            <div className="micro">
              {g.members.filter((m) => m.support_groups.length > 0).length} av{' '}
              {g.members.length} i någon supportgrupp
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-soft)',
            }}
          >
            {['Namn', 'Supportgrupper', 'Intjänat', 'Uttaget', 'Kvar'].map((h) => (
              <div
                key={h}
                className="micro"
                style={{ fontWeight: 600, color: 'var(--text-2)' }}
              >
                {h}
              </div>
            ))}
          </div>
          {g.members.map((m, i) => {
            const used = requests
              .filter((r) => r.user_id === m.id && r.status === 'beviljad')
              .reduce((s, r) => s + r.days, 0);
            const total = m.earned + m.saved;
            const kvar = total - used;
            return (
              <div
                key={m.id}
                onClick={() => onEdit(m)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.4fr 1fr 1fr 1fr',
                  padding: '10px 16px',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.background = 'var(--bg-soft)';
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.background = '';
                }}
              >
                <div className="row" style={{ gap: 10 }}>
                  <Avatar name={m.name} initials={m.initials} size={24} />
                  <span style={{ fontSize: 13.5 }}>{m.name}</span>
                  {m.role === 'chef' && (
                    <span className="pill" style={{ background: 'var(--bg-soft)' }}>
                      Chef
                    </span>
                  )}
                </div>
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {m.support_groups.length > 0 ? (
                    m.support_groups.map((gid) => (
                      <span
                        key={gid}
                        className="pill"
                        style={{
                          background: 'var(--brand-soft)',
                          color: 'var(--brand-2)',
                          borderColor:
                            'color-mix(in oklch, var(--brand) 25%, var(--border))',
                          fontSize: 10.5,
                          padding: '1px 6px',
                        }}
                      >
                        {SUPPORT_GROUPS[gid].short}
                      </span>
                    ))
                  ) : (
                    <span className="micro" style={{ color: 'var(--text-4)' }}>
                      —
                    </span>
                  )}
                </div>
                <div className="mono">
                  {m.earned}
                  {m.saved > 0 ? ` + ${m.saved}` : ''}
                </div>
                <div className="mono">{used}</div>
                <div className="mono" style={{ fontWeight: 600 }}>
                  {kvar}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Keep import — re-export type
export type { Employee, VacationRequest };
void Pill;
