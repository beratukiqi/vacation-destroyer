'use client';

import { useMemo, useState } from 'react';
import { Sidebar, type Route } from '@/components/Sidebar';
import { SearchBox } from '@/components/SearchBox';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { NewRequestForm } from '@/components/NewRequestForm';
import { NewSupportForm } from '@/components/NewSupportForm';
import { ManagerDecisions } from '@/components/ManagerDecisions';
import { ManagerCalendar } from '@/components/ManagerCalendar';
import { SupportCalendar } from '@/components/SupportCalendar';
import { TeamRoster } from '@/components/TeamRoster';
import { EmployeeForm } from '@/components/EmployeeForm';
import { ToastHost, useToast } from '@/components/ui/Toast';
import {
  EMPLOYEES,
  REQUESTS,
  SUPPORT_ASSIGNMENTS,
  SUPPORT_GROUPS,
} from '@/lib/data';
import type {
  Employee,
  Role,
  SupportAssignment,
  SupportGroupId,
  VacationRequest,
} from '@/lib/types';

export default function Page() {
  return (
    <ToastHost>
      <App />
    </ToastHost>
  );
}

function App() {
  const [role, setRole] = useState<Role>('chef');
  const [requests, setRequests] = useState<VacationRequest[]>(REQUESTS);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [assignments, setAssignments] = useState<SupportAssignment[]>(SUPPORT_ASSIGNMENTS);
  const [editingRequest, setEditingRequest] = useState<VacationRequest | null>(null);
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [employeeFormSubject, setEmployeeFormSubject] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');

  const [empRoute, setEmpRoute] = useState<Route>('home');
  const [chefRoute, setChefRoute] = useState<Route>('decisions');

  const push = useToast();

  const employeeUser = useMemo(
    () => employees.find((e) => e.id === 'u14') ?? employees[1],
    [employees]
  );
  const chefUser = useMemo(
    () => employees.find((e) => e.role === 'chef') ?? employees[0],
    [employees]
  );

  const route = role === 'chef' ? chefRoute : empRoute;
  const setRoute = (r: Route) => {
    if (role === 'chef') setChefRoute(r);
    else {
      setEditingRequest(null);
      setEmpRoute(r);
    }
  };
  const currentUser = role === 'chef' ? chefUser : employeeUser;

  const pendingCount = requests.filter((r) => r.status === 'ansökt').length;

  function approveRequest(id: string) {
    setRequests((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, status: 'beviljad', decided_at: '2026-05-20', decided_by: 'u01' }
          : r
      )
    );
    push('Ansökan beviljad — den anställde har meddelats');
  }
  function denyRequest(id: string, comment: string) {
    setRequests((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'avslagen',
              decided_at: '2026-05-20',
              decided_by: 'u01',
              comment: comment || 'Avslagen',
            }
          : r
      )
    );
    push('Ansökan avslagen');
  }
  function submitNewRequest(newReqs: VacationRequest[], replaceId: string | null) {
    setRequests((rs) => {
      const filtered = replaceId ? rs.filter((r) => r.id !== replaceId) : rs;
      return [...filtered, ...newReqs];
    });
    setEditingRequest(null);
    push(
      replaceId
        ? 'Ansökan uppdaterad — väntar på beslut'
        : `Ansökan inskickad — väntar på beslut från ${chefUser.name.split(' ')[0]}`
    );
    setEmpRoute('home');
  }
  function withdrawRequest(id: string) {
    setRequests((rs) => rs.filter((r) => r.id !== id));
    push('Ansökan borttagen');
  }
  function startEdit(r: VacationRequest) {
    setEditingRequest(r);
    setEmpRoute('new');
  }
  function addSupportAssignments(newAssigns: SupportAssignment[]) {
    if (newAssigns.length === 0) return;
    setAssignments((as) => {
      const existing = new Set(
        as.map((a) => a.user_id + '|' + a.group_id + '|' + a.date)
      );
      const toAdd = newAssigns.filter(
        (a) => !existing.has(a.user_id + '|' + a.group_id + '|' + a.date)
      );
      return [...as, ...toAdd];
    });
    const groupId = newAssigns[0].group_id;
    push(
      `Tillagd på ${SUPPORT_GROUPS[groupId].short} — ${newAssigns.length} ${newAssigns.length === 1 ? 'dag' : 'dagar'}`
    );
    setEmpRoute('home');
  }
  function toggleAssignment(userId: string, groupId: SupportGroupId, date: string) {
    setAssignments((as) => {
      const idx = as.findIndex(
        (a) => a.user_id === userId && a.group_id === groupId && a.date === date
      );
      if (idx >= 0) {
        const empName =
          employees.find((e) => e.id === userId)?.name?.split(' ')[0] ?? 'Tilldelning';
        push(`${empName} borttagen från ${SUPPORT_GROUPS[groupId].short} ${date}`);
        return as.filter((_, i) => i !== idx);
      }
      const empName =
        employees.find((e) => e.id === userId)?.name?.split(' ')[0] ?? 'Tilldelad';
      push(`${empName} tilldelad ${SUPPORT_GROUPS[groupId].short} ${date}`);
      return [
        ...as,
        { id: 'a' + Date.now(), user_id: userId, group_id: groupId, date },
      ];
    });
  }
  function saveEmployee(data: Employee, isNew: boolean) {
    if (isNew) {
      const id = 'u' + Date.now();
      setEmployees((es) => [...es, { ...data, id, used: 0 }]);
      push(`${data.name} tillagd som anställd`);
    } else {
      setEmployees((es) => es.map((e) => (e.id === data.id ? { ...e, ...data } : e)));
      push(`${data.name} uppdaterad`);
    }
    setEmployeeFormOpen(false);
  }
  function deleteEmployee(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    setEmployees((es) => es.filter((e) => e.id !== empId));
    setRequests((rs) => rs.filter((r) => r.user_id !== empId));
    setAssignments((as) => as.filter((a) => a.user_id !== empId));
    push(`${emp?.name ?? 'Anställd'} borttagen`);
    setEmployeeFormOpen(false);
  }

  const titles: Record<Role, Record<string, [string, string]>> = {
    employee: {
      home: ['Min översikt', 'Saldo, ansökningar och team'],
      new: [
        editingRequest ? 'Redigera ansökan' : 'Ny ansökan',
        editingRequest
          ? 'Justera datum eller dra tillbaka'
          : 'Skicka in semesteransökan',
      ],
      'support-new': ['Lägg till support', 'Anmäl dig till support'],
      overview: ['Översiktskalender', 'Hela kontoret sommar 2026'],
      support: ['Supportkalender', 'Vem täcker support-skiftet?'],
    },
    chef: {
      decisions: ['Beslut', `${pendingCount} att besluta`],
      overview: ['Översiktskalender', 'Hela kontoret sommar 2026'],
      support: ['Supportkalender', 'Vem täcker support-skiftet?'],
      team: ['Anställda', `${employees.filter((e) => e.role === 'employee').length} personer`],
    },
  };
  const [title, subtitle] =
    (titles[role] && titles[role][route as keyof (typeof titles)[Role]]) || ['', ''];

  let screen: JSX.Element | null = null;
  if (role === 'employee') {
    if (route === 'home') {
      screen = (
        <EmployeeDashboard
          user={employeeUser}
          employees={employees}
          requests={requests}
          onNewRequest={() => setEmpRoute('new')}
          onEditRequest={startEdit}
          onWithdrawRequest={withdrawRequest}
          onOpenCalendar={() => setEmpRoute('overview')}
        />
      );
    } else if (route === 'new') {
      screen = (
        <NewRequestForm
          user={employeeUser}
          requests={requests}
          editing={editingRequest}
          onSubmit={submitNewRequest}
          onCancel={() => {
            setEditingRequest(null);
            setEmpRoute('home');
          }}
        />
      );
    } else if (route === 'support-new') {
      screen = (
        <NewSupportForm
          user={employeeUser}
          employees={employees}
          assignments={assignments}
          requests={requests}
          onSubmit={addSupportAssignments}
          onCancel={() => setEmpRoute('home')}
        />
      );
    } else if (route === 'overview') {
      screen = <ManagerCalendar employees={employees} requests={requests} search={search} />;
    } else if (route === 'support') {
      screen = (
        <SupportCalendar
          employees={employees}
          requests={requests}
          assignments={assignments}
          role="employee"
          currentUserId={employeeUser.id}
          search={search}
          onToggleAssignment={toggleAssignment}
        />
      );
    }
  } else {
    if (route === 'decisions') {
      screen = (
        <ManagerDecisions
          employees={employees}
          requests={requests}
          onApprove={approveRequest}
          onDeny={denyRequest}
        />
      );
    } else if (route === 'overview') {
      screen = <ManagerCalendar employees={employees} requests={requests} search={search} />;
    } else if (route === 'support') {
      screen = (
        <SupportCalendar
          employees={employees}
          requests={requests}
          assignments={assignments}
          role="chef"
          currentUserId={chefUser.id}
          search={search}
          onToggleAssignment={toggleAssignment}
        />
      );
    } else if (route === 'team') {
      screen = (
        <TeamRoster
          employees={employees}
          requests={requests}
          onAdd={() => {
            setEmployeeFormSubject(null);
            setEmployeeFormOpen(true);
          }}
          onEdit={(e) => {
            setEmployeeFormSubject(e);
            setEmployeeFormOpen(true);
          }}
        />
      );
    }
  }

  return (
    <div className="app">
      <Sidebar
        role={role}
        route={route}
        setRoute={setRoute}
        currentUser={currentUser}
        pendingCount={pendingCount}
      />
      <div className="main">
        <header className="topbar">
          <div className="topbar-l">
            <div className="col" style={{ gap: 1 }}>
              <div className="crumb">
                {role === 'chef' ? 'Chefsvy' : `${currentUser.name} · Anställd`}
              </div>
              <div className="page-title">{title}</div>
            </div>
            {subtitle && (
              <span className="pill" style={{ marginLeft: 8 }}>
                {subtitle}
              </span>
            )}
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setRole(role === 'chef' ? 'employee' : 'chef')}
              style={{ marginLeft: 16 }}
              title="Växla roll (demo)"
            >
              Växla till {role === 'chef' ? 'anställd' : 'chef'}
            </button>
          </div>
          <div className="topbar-r">
            {(route === 'overview' || route === 'support') && (
              <SearchBox value={search} onChange={setSearch} />
            )}
          </div>
        </header>
        <main className="content">{screen}</main>
      </div>

      <EmployeeForm
        open={employeeFormOpen}
        employee={employeeFormSubject}
        onClose={() => setEmployeeFormOpen(false)}
        onSave={saveEmployee}
        onDelete={deleteEmployee}
      />
    </div>
  );
}
