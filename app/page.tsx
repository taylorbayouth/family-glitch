import { Header } from '@/components/Header';
import { auth } from '@/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Header />
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>
          Welcome to Family Glitch
        </h1>
        <p style={{ fontSize: '20px', color: '#666', marginBottom: '40px' }}>
          {session
            ? `Hi, ${session.user?.name}! Ready to play?`
            : 'Sign in to get started'}
        </p>

        {session && (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link
              href="/chat"
              style={{
                padding: '16px 32px',
                background: '#4285f4',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '500'
              }}
            >
              Try AI Chat
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
