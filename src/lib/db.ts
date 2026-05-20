// JSON-file backed user database. Seeded once from EMPLOYEES with a shared demo
// password. Reads on every call (small dataset; fine for this app), writes are
// atomic via tmp-file + rename so a crash mid-write can't corrupt the file.

import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { EMPLOYEES } from './data';
import type { Employee, Role, SupportGroupId, TeamId } from './types';

export const DEMO_PASSWORD = 'Sommar2026!';

export interface UserRecord extends Employee {
  email: string;
  password_hash: string;
  created_at: string;
}

interface DbShape {
  version: number;
  users: UserRecord[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function defaultEmailFor(name: string): string {
  return `${slugify(name)}@dom.se`;
}

async function readDb(): Promise<DbShape | null> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw) as DbShape;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DB_PATH);
}

let seedPromise: Promise<DbShape> | null = null;

async function seed(): Promise<DbShape> {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users: UserRecord[] = EMPLOYEES.map((emp) => ({
    ...emp,
    email: defaultEmailFor(emp.name),
    password_hash: hash,
    created_at: new Date().toISOString(),
  }));
  const db: DbShape = { version: 1, users };
  await writeDb(db);
  return db;
}

async function load(): Promise<DbShape> {
  const existing = await readDb();
  if (existing) return existing;
  if (!seedPromise) seedPromise = seed().finally(() => { seedPromise = null; });
  return seedPromise;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await load();
  const norm = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === norm) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const db = await load();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function listUsers(): Promise<UserRecord[]> {
  const db = await load();
  return db.users;
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<UserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  team?: TeamId | '';
  support_groups?: SupportGroupId[];
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const db = await load();
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('EMAIL_TAKEN');
  }
  const name = input.name.trim();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
  const password_hash = await bcrypt.hash(input.password, 10);
  const role: Role = 'employee';
  const user: UserRecord = {
    id: 'u' + Date.now(),
    name,
    initials: initials || '??',
    email,
    team: input.team ?? '',
    role,
    support_groups: input.support_groups ?? [],
    earned: 25,
    saved: 0,
    used: 0,
    password_hash,
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDb(db);
  return user;
}

export function toEmployee(u: UserRecord): Employee {
  const { password_hash: _ph, created_at: _ca, email: _e, ...emp } = u;
  return emp;
}
