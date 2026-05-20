'use client';

import { useEffect, type ReactNode, type MouseEvent } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="modal-wrap" onMouseDown={onBackdrop}>
      <div className="modal">
        {title && (
          <div className="modal-hd">
            <div className="h2">{title}</div>
          </div>
        )}
        <div className="modal-bd">{children}</div>
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}
