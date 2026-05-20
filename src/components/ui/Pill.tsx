import type { RequestStatus } from '@/lib/types';
import type { ReactNode } from 'react';

const LABEL_BY_STATUS: Record<RequestStatus, [string, string]> = {
  ansökt:   ['pill-pending', 'Ansökt'],
  beviljad: ['pill-approved', 'Beviljad'],
  avslagen: ['pill-denied', 'Avslagen'],
  utkast:   ['pill-draft', 'Utkast'],
};

export function Pill({
  status,
  children,
}: {
  status?: RequestStatus;
  children?: ReactNode;
}) {
  if (status) {
    const [cls, label] = LABEL_BY_STATUS[status];
    return (
      <span className={`pill ${cls}`}>
        <span className="dot" />
        {children ?? label}
      </span>
    );
  }
  return <span className="pill">{children}</span>;
}
