import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db';

interface Body {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

function isNonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Ogiltig request-body' }, { status: 400 });
  }

  if (!isNonEmpty(body.name)) {
    return NextResponse.json({ error: 'Namn krävs' }, { status: 400 });
  }
  if (!isNonEmpty(body.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Giltig e-postadress krävs' }, { status: 400 });
  }
  if (!isNonEmpty(body.password) || body.password.length < 8) {
    return NextResponse.json(
      { error: 'Lösenord måste vara minst 8 tecken' },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({
      name: body.name,
      email: body.email,
      password: body.password,
    });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return NextResponse.json(
        { error: 'E-postadressen är redan registrerad' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Något gick fel vid registreringen' },
      { status: 500 }
    );
  }
}
