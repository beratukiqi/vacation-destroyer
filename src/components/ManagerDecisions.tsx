'use client';

import { useState } from 'react';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { Pill } from './ui/Pill';
import { fmtRangeSv, fmtWeekRange, parse, addDays, isWeekend } from '@/lib/dates';
import { SUPPORT_GROUPS, TEAMS, membersOfGroup, isHoliday } from '@/lib/data';
import type { Employee, VacationRequest } from '@/lib/types';

interface Props {
  employees: Employee[];
  requests: VacationRequest[];
  onApprove: (id: string) => void;
  onDeny: (id: string, comment: string) => void;
}

type Filter = 'ansökt' | 'beviljad' | 'avslagen' | 'all';

interface RiskInfo {
  conflictDays: number;
  groups: { group: { id: string; name: string; short: string }; conflictDays: number }[];
}

export function ManagerDecisions({ employees, requests, onApprove, onDeny }: Props) {
  const [filter, setFilter] = useState<Filter>('ansökt');
  const [denyTarget, setDenyTarget] = useState<VacationRequest | null>(null);
  const [denyComment, setDenyComment] = useState('');
  const [approveTarget, setApproveTarget] = useState<VacationRequest | null>(null);

  const empById = Object.fromEntries(employees.map((e) => [e.id, e]));

  const sorted = requests
    .filter((r) => (filter === 'all' ? true : r.status === filter))
    .sort((a, b) => {
      if (a.status === 'ansökt' && b.status !== 'ansökt') return -1;
      if (b.status === 'ansökt' && a.status !== 'ansökt') return 1;
      return a.applied_at.localeCompare(b.applied_at);
    });

  function riskInfo(req: VacationRequest): RiskInfo | null {
    const emp = empById[req.user_id];
    if (!emp || emp.support_groups.length === 0) return null;
    const start = parse(req.start_date);
    const end = parse(req.end_date);
    const perGroup: RiskInfo['groups'] = [];

    for (const gid of emp.support_groups) {
      const members = membersOfGroup(employees, gid);
      const others = members.filter((m) => m.id !== emp.id);
      let conflictDays = 0;
      let d = new Date(start);
      while (d <= end) {
        if (!isWeekend(d) && !isHoliday(d)) {
          const othersAway = others.filter((p) =>
            requests.some(
              (r) =>
                r.user_id === p.id &&
                (r.status === 'beviljad' ||
                  (r.status === 'ansökt' && r.id !== req.id)) &&
                parse(r.start_date) <= d &&
                parse(r.end_date) >= d
            )
          ).length;
          if (others.length - othersAway === 0) conflictDays++;
        }
        d = addDays(d, 1);
      }
      if (conflictDays > 0) perGroup.push({ group: SUPPORT_GROUPS[gid], conflictDays });
    }

    if (perGroup.length === 0) return null;
    return {
      conflictDays: perGroup.reduce((s, x) => s + x.conflictDays, 0),
      groups: perGroup,
    };
  }

  const pendingCount = requests.filter((r) => r.status === 'ansökt').length;

  return (
    <div className="col" style={{ gap: 'var(--gap)' }}>
      <div className="sticky-section">
        <div className="row between">
          <div className="col" style={{ gap: 2 }}>
            <div className="h1">Beslut</div>
            <div className="sub">
              {pendingCount}{' '}
              {pendingCount === 1 ? 'ansökan väntar' : 'ansökningar väntar'} på beslut.
            </div>
          </div>
          <div className="seg">
            <button
              className={filter === 'ansökt' ? 'on' : ''}
              onClick={() => setFilter('ansökt')}
            >
              Att besluta
            </button>
            <button
              className={filter === 'beviljad' ? 'on' : ''}
              onClick={() => setFilter('beviljad')}
            >
              Beviljade
            </button>
            <button
              className={filter === 'avslagen' ? 'on' : ''}
              onClick={() => setFilter('avslagen')}
            >
              Avslagna
            </button>
            <button
              className={filter === 'all' ? 'on' : ''}
              onClick={() => setFilter('all')}
            >
              Alla
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)' }}>
            <Icon name="check" size={26} />
            <div className="h2" style={{ marginTop: 8, color: 'var(--text-2)' }}>
              Alla beslut är fattade
            </div>
            <div className="sub">Inga ansökningar väntar just nu.</div>
          </div>
        ) : (
          sorted.map((r, i) => {
            const emp = empById[r.user_id];
            const risk = r.status === 'ansökt' ? riskInfo(r) : null;
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 16,
                  padding: '16px 18px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div className="col" style={{ gap: 8, minWidth: 0 }}>
                  <div className="row" style={{ gap: 12 }}>
                    <Avatar name={emp.name} initials={emp.initials} size={36} />
                    <div className="col" style={{ gap: 2 }}>
                      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5 }}>
                          {emp.name}
                        </div>
                        <span className="pill" style={{ background: 'var(--bg-soft)' }}>
                          {emp.team ? TEAMS[emp.team].short : '—'}
                        </span>
                        {emp.support_groups.slice(0, 3).map((gid) => (
                          <span
                            key={gid}
                            className="pill"
                            style={{
                              background: 'var(--brand-soft)',
                              color: 'var(--brand-2)',
                              borderColor:
                                'color-mix(in oklch, var(--brand) 30%, var(--border))',
                              fontSize: 10.5,
                            }}
                          >
                            {SUPPORT_GROUPS[gid].short}
                          </span>
                        ))}
                        {emp.support_groups.length > 3 && (
                          <span className="micro">
                            +{emp.support_groups.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="micro">Inskickad {r.applied_at}</div>
                    </div>
                  </div>

                  <div
                    className="row"
                    style={{ gap: 18, marginLeft: 48, marginTop: 2 }}
                  >
                    <Stat label="Period" value={fmtRangeSv(r.start_date, r.end_date)} />
                    <Stat
                      label="Veckor"
                      value={fmtWeekRange(r.start_date, r.end_date)}
                      mono
                    />
                    <Stat label="Dagar" value={r.days.toString()} mono />
                    <Stat
                      label="Saldo efter"
                      value={`${emp.earned + emp.saved - emp.used - (r.status === 'ansökt' ? r.days : 0)} d`}
                      mono
                    />
                    <div className="col" style={{ gap: 2 }}>
                      <div className="micro">Status</div>
                      <Pill status={r.status} />
                    </div>
                  </div>

                  {r.comment && r.status === 'ansökt' && (
                    <div
                      style={{
                        marginLeft: 48,
                        marginTop: 2,
                        padding: '8px 12px',
                        background: 'var(--bg-soft)',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--text-2)',
                        borderLeft: '3px solid var(--border-strong)',
                      }}
                    >
                      <span className="micro" style={{ display: 'block', marginBottom: 2 }}>
                        Kommentar från {emp.name.split(' ')[0]}
                      </span>
                      {r.comment}
                    </div>
                  )}

                  {risk && (
                    <div
                      style={{
                        marginLeft: 48,
                        marginTop: 2,
                        padding: '8px 12px',
                        background: 'var(--risk-bg)',
                        border: '1px solid var(--risk-bd)',
                        borderRadius: 8,
                        color: 'var(--st-denied-fg)',
                        fontSize: 12.5,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Icon name="warn" size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div className="col" style={{ gap: 2 }}>
                        <div>
                          <strong>Bemanningsvarning:</strong> påverkar{' '}
                          {risk.groups.length}{' '}
                          {risk.groups.length === 1 ? 'supportgrupp' : 'supportgrupper'}.
                        </div>
                        <div
                          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}
                        >
                          {risk.groups.map((g) => (
                            <span
                              key={g.group.id}
                              className="pill"
                              style={{ background: 'var(--surface)', fontSize: 11 }}
                            >
                              {g.group.name}: {g.conflictDays}{' '}
                              {g.conflictDays === 1 ? 'dag' : 'dagar'} utan täckning
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {r.status === 'ansökt' ? (
                  <div className="col" style={{ gap: 6, alignItems: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setApproveTarget(r)}
                    >
                      <Icon name="check" size={14} /> Bevilja
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setDenyTarget(r);
                        setDenyComment('');
                      }}
                    >
                      Avslå
                    </button>
                  </div>
                ) : (
                  <div
                    className="col"
                    style={{
                      gap: 2,
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      color: 'var(--text-3)',
                      fontSize: 12,
                    }}
                  >
                    <div>{r.status === 'beviljad' ? 'Beviljad' : 'Avslagen'}</div>
                    <div className="mono">{r.decided_at}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={!!denyTarget}
        title="Avslå ansökan"
        onClose={() => setDenyTarget(null)}
        footer={
          <>
            <button className="btn" onClick={() => setDenyTarget(null)}>
              Avbryt
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (denyTarget) onDeny(denyTarget.id, denyComment);
                setDenyTarget(null);
                setDenyComment('');
              }}
            >
              Avslå ansökan
            </button>
          </>
        }
      >
        {denyTarget && (
          <div className="col" style={{ gap: 12 }}>
            <div className="sub">
              Avslå semesteransökan för{' '}
              <strong style={{ color: 'var(--text)' }}>
                {empById[denyTarget.user_id].name}
              </strong>{' '}
              ({fmtRangeSv(denyTarget.start_date, denyTarget.end_date)}, {denyTarget.days} d).
            </div>
            <div className="col" style={{ gap: 6 }}>
              <div className="h3">Kort kommentar (visas för den anställde)</div>
              <textarea
                className="input textarea"
                placeholder="T.ex. krockar med planerad release, ta gärna v32 istället"
                value={denyComment}
                onChange={(e) => setDenyComment(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!approveTarget}
        title="Bevilja semesteransökan"
        onClose={() => setApproveTarget(null)}
        footer={
          <>
            <button className="btn" onClick={() => setApproveTarget(null)}>
              Avbryt
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (approveTarget) onApprove(approveTarget.id);
                setApproveTarget(null);
              }}
            >
              <Icon name="check" size={14} /> Bekräfta och bevilja
            </button>
          </>
        }
      >
        {approveTarget &&
          (() => {
            const emp = empById[approveTarget.user_id];
            const risk = riskInfo(approveTarget);
            return (
              <div className="col" style={{ gap: 14 }}>
                <div className="sub">
                  Du är på väg att bevilja semester för{' '}
                  <strong style={{ color: 'var(--text)' }}>{emp.name}</strong>. Den
                  anställde meddelas direkt.
                </div>

                <div
                  className="col"
                  style={{
                    gap: 8,
                    padding: '12px 14px',
                    background: 'var(--bg-soft)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                  }}
                >
                  <Row
                    label="Period"
                    value={fmtRangeSv(approveTarget.start_date, approveTarget.end_date)}
                  />
                  <Row
                    label="Veckor"
                    value={fmtWeekRange(approveTarget.start_date, approveTarget.end_date)}
                  />
                  <Row label="Antal dagar" value={approveTarget.days.toString()} bold />
                  <Row
                    label="Saldo efter beviljande"
                    value={`${emp.earned + emp.saved - emp.used - approveTarget.days} av ${emp.earned + emp.saved}`}
                  />
                </div>

                {risk && (
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'var(--risk-bg)',
                      border: '1px solid var(--risk-bd)',
                      borderRadius: 8,
                      color: 'var(--st-denied-fg)',
                      fontSize: 13,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Icon name="warn" size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div className="col" style={{ gap: 6 }}>
                      <span>
                        <strong>Observera:</strong> Beviljas detta drabbas{' '}
                        {risk.groups.length}{' '}
                        {risk.groups.length === 1 ? 'supportgrupp' : 'supportgrupper'}:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                        {risk.groups.map((g) => (
                          <li key={g.group.id}>
                            <strong>{g.group.name}:</strong> {g.conflictDays}{' '}
                            {g.conflictDays === 1 ? 'arbetsdag' : 'arbetsdagar'} utan
                            täckning
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="col" style={{ gap: 2 }}>
      <div className="micro">{label}</div>
      <div className={mono ? 'mono' : ''} style={{ fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="row between">
      <div className="micro">{label}</div>
      <div className="mono" style={{ fontWeight: bold ? 600 : 500 }}>
        {value}
      </div>
    </div>
  );
}
