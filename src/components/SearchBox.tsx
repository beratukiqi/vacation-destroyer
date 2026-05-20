'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui/Icon';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div
      className="row"
      style={{
        gap: 6,
        background: open ? 'var(--surface)' : 'transparent',
        border: '1px solid ' + (open ? 'var(--border)' : 'transparent'),
        borderRadius: 7,
        padding: open ? '0 6px 0 8px' : '0',
        transition: 'all .12s',
      }}
    >
      <button
        className="btn btn-icon btn-ghost"
        onClick={() => {
          if (open) {
            onChange('');
            setOpen(false);
          } else setOpen(true);
        }}
        title={open ? 'Stäng sök' : 'Sök anställd'}
      >
        <Icon name="search" size={16} />
      </button>
      {open && (
        <>
          <input
            ref={inputRef}
            className="input"
            type="text"
            value={value}
            placeholder="Sök anställd…"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onChange('');
                setOpen(false);
              }
            }}
            style={{
              border: 0,
              background: 'transparent',
              boxShadow: 'none',
              padding: '5px 0',
              width: 220,
              fontSize: 13,
            }}
          />
          {value && (
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => onChange('')}
              title="Rensa"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
