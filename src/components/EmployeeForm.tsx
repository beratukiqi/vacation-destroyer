'use client';

import { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { Modal } from './ui/Modal';
import { SUPPORT_GROUPS, SUPPORT_GROUPS_ORDER, TEAM_ORDER, TEAMS } from '@/lib/data';
import type { Employee, SupportGroupId, TeamId } from '@/lib/types';

interface Props {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (data: Employee, isNew: boolean) => void;
  onDelete: (id: string) => void;
}

interface FormState {
  id?: string;
  name: string;
  initials: string;
  email: string;
  team: TeamId | '';
  role: 'employee' | 'chef';
  support_groups: SupportGroupId[];
  earned: number;
  saved: number;
  used: number;
  initialsDirty: boolean;
}

function initial(employee: Employee | null): FormState {
  if (employee) {
    return {
      ...employee,
      email: employee.email ?? '',
      support_groups: employee.support_groups ?? [],
      initialsDirty: true,
    };
  }
  return {
    name: '',
    initials: '',
    email: '',
    team: '',
    role: 'employee',
    support_groups: [],
    earned: 30,
    saved: 0,
    used: 0,
    initialsDirty: false,
  };
}

function autoInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function validate(form: FormState) {
  const e: Record<string, string> = {};
  if (!form.name || form.name.trim().length < 2) e.name = 'Krävs';
  if (!form.team) e.team = 'Välj enhet';
  return e;
}

export function EmployeeForm({ open, employee, onClose, onSave, onDelete }: Props) {
  const isNew = !employee;
  const [form, setForm] = useState<FormState>(() => initial(employee));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) setForm(initial(employee));
  }, [open, employee]);

  if (!open) return null;

  const errors = validate(form);
  const canSave = Object.keys(errors).length === 0;

  const update = (patch: Partial<FormState>) =>
    setForm((f) => ({ ...f, ...patch }));

  function toggleGroup(gid: SupportGroupId) {
    setForm((f) => {
      const has = f.support_groups.includes(gid);
      return {
        ...f,
        support_groups: has
          ? f.support_groups.filter((g) => g !== gid)
          : [...f.support_groups, gid],
      };
    });
  }

  function submit() {
    if (!canSave) return;
    const data: Employee = {
      id: form.id ?? '',
      name: form.name,
      initials: (form.initials || autoInitials(form.name)).toUpperCase().slice(0, 2),
      email: form.email,
      team: form.team as TeamId,
      role: form.role,
      support_groups: form.support_groups,
      earned: form.earned,
      saved: form.saved,
      used: form.used,
    };
    onSave(data, isNew);
  }

  return (
    <div
      className="modal-wrap"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ width: 'min(640px, 100%)' }}>
        <div
          className="modal-hd row between"
          style={{ padding: '18px 22px 4px', alignItems: 'flex-start' }}
        >
          <div className="col" style={{ gap: 2 }}>
            <div className="h2">{isNew ? 'Lägg till anställd' : 'Redigera anställd'}</div>
            <div className="sub">
              {isNew
                ? 'Skapa konto, sätt enhet och valfria supportgrupper.'
                : `Justera ${employee?.name}s uppgifter`}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div
          className="modal-bd"
          style={{ padding: '4px 22px 18px', maxHeight: '70vh', overflowY: 'auto' }}
        >
          <div className="col" style={{ gap: 14 }}>
            <Section label="Persondata">
              <Field label="Namn" required error={errors.name}>
                <input
                  className="input"
                  type="text"
                  value={form.name}
                  placeholder="Förnamn Efternamn"
                  onChange={(e) => {
                    const name = e.target.value;
                    update({
                      name,
                      initials: form.initialsDirty ? form.initials : autoInitials(name),
                    });
                  }}
                />
              </Field>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}
              >
                <Field label="E-post">
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    placeholder="fornamn.efternamn@domstol.se"
                    onChange={(e) => update({ email: e.target.value })}
                  />
                </Field>
                <Field label="Initialer">
                  <input
                    className="input"
                    type="text"
                    value={form.initials}
                    maxLength={2}
                    style={{
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      fontFamily: 'Geist Mono, monospace',
                      fontWeight: 600,
                    }}
                    onChange={(e) =>
                      update({
                        initials: e.target.value.toUpperCase(),
                        initialsDirty: true,
                      })
                    }
                  />
                </Field>
              </div>
            </Section>

            <Section label="Anställning">
              <Field label="Enhet" required error={errors.team}>
                <select
                  className="select"
                  value={form.team}
                  onChange={(e) => update({ team: e.target.value as TeamId })}
                >
                  <option value="">Välj enhet…</option>
                  {TEAM_ORDER.map((tid) => (
                    <option key={tid} value={tid}>
                      {TEAMS[tid].name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Roll">
                <div className="seg">
                  <button
                    onClick={() => update({ role: 'employee' })}
                    className={form.role === 'employee' ? 'on' : ''}
                  >
                    Anställd
                  </button>
                  <button
                    onClick={() => update({ role: 'chef' })}
                    className={form.role === 'chef' ? 'on' : ''}
                  >
                    Chef
                  </button>
                </div>
              </Field>
            </Section>

            <Section
              label="Supportgrupper"
              hint={
                form.support_groups.length === 0
                  ? 'Ingen vald — anställd är inte med i supportrotation.'
                  : `${form.support_groups.length} ${
                      form.support_groups.length === 1 ? 'grupp vald' : 'grupper valda'
                    }`
              }
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 6,
                }}
              >
                {SUPPORT_GROUPS_ORDER.map((gid) => {
                  const g = SUPPORT_GROUPS[gid];
                  const on = form.support_groups.includes(gid);
                  return (
                    <label
                      key={gid}
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        padding: '7px 10px',
                        borderRadius: 7,
                        border:
                          '1px solid ' +
                          (on
                            ? 'color-mix(in oklch, var(--brand) 40%, var(--border))'
                            : 'var(--border)'),
                        background: on ? 'var(--brand-soft)' : 'var(--surface)',
                        cursor: 'default',
                        fontSize: 12.5,
                        minWidth: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleGroup(gid)}
                        style={{ accentColor: 'var(--brand)', flexShrink: 0 }}
                      />
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          background: on ? 'var(--surface)' : 'var(--bg-soft)',
                          color: 'var(--text-3)',
                          borderRadius: 4,
                          border: '1px solid var(--border)',
                          minWidth: 38,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {g.short}
                      </span>
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                          flex: 1,
                        }}
                        title={g.name}
                      >
                        {g.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Section>

            <Section label="Semestersaldo 2026">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Intjänade dagar" hint="Standard enligt avtal: 25–30">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={40}
                    value={form.earned}
                    onChange={(e) => update({ earned: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Sparade dagar" hint="Från tidigare år, max 30">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={30}
                    value={form.saved}
                    onChange={(e) => update({ saved: Number(e.target.value) })}
                  />
                </Field>
              </div>
            </Section>
          </div>
        </div>

        <div
          className="modal-ft"
          style={{ justifyContent: isNew ? 'flex-end' : 'space-between' }}
        >
          {!isNew && (
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--st-denied-fg)' }}
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="x" size={14} /> Ta bort anställd
            </button>
          )}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={onClose}>
              Avbryt
            </button>
            <button
              className="btn btn-primary"
              disabled={!canSave}
              style={!canSave ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              onClick={submit}
            >
              {isNew ? 'Lägg till anställd' : 'Spara ändringar'}
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        title="Ta bort anställd"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDelete(false)}>
              Avbryt
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (employee) onDelete(employee.id);
                setConfirmDelete(false);
              }}
            >
              Ta bort permanent
            </button>
          </>
        }
      >
        <div className="col" style={{ gap: 8 }}>
          <div className="sub">
            Är du säker på att du vill ta bort{' '}
            <strong style={{ color: 'var(--text)' }}>{employee?.name}</strong>?
          </div>
          <div
            className="sub"
            style={{
              padding: '10px 12px',
              background: 'var(--st-denied-bg)',
              borderRadius: 8,
              border: '1px solid var(--st-denied-bd)',
              color: 'var(--st-denied-fg)',
              fontSize: 12.5,
            }}
          >
            Detta tar bort alla aktiva ansökningar och supporttilldelningar. Kan inte ångras.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row between" style={{ alignItems: 'baseline' }}>
        <div
          className="h3"
          style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text)' }}
        >
          {label}
        </div>
        {hint && (
          <div className="micro" style={{ color: 'var(--text-3)' }}>
            {hint}
          </div>
        )}
      </div>
      <div
        className="col"
        style={{
          gap: 10,
          padding: '12px 14px',
          background: 'var(--bg-soft)',
          borderRadius: 10,
          border: '1px solid var(--border)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <div className="row" style={{ gap: 6, alignItems: 'baseline' }}>
        <span
          className="micro"
          style={{ fontWeight: 500, color: 'var(--text-2)' }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--st-denied-fg)', marginLeft: 2 }}>*</span>
          )}
        </span>
        {hint && !error && (
          <span className="micro" style={{ color: 'var(--text-4)' }}>
            {hint}
          </span>
        )}
        {error && (
          <span className="micro" style={{ color: 'var(--st-denied-fg)' }}>
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
