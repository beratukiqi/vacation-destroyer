export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    // Protect every route except: NextAuth endpoints, the public register
    // endpoint, the login/register pages, Next.js internals and static assets.
    '/((?!api/auth|api/register|login|register|_next/static|_next/image|favicon\\.ico|images/).*)',
  ],
};
