'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header style={{
      borderBottom: '1px solid #e0e0e0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'white'
    }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/" style={{
          fontSize: '20px',
          fontWeight: 'bold',
          textDecoration: 'none',
          color: '#000'
        }}>
          Family Glitch
        </Link>

        {session && (
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link href="/chat" style={{ textDecoration: 'none', color: '#666' }}>
              AI Chat
            </Link>
          </nav>
        )}
      </div>

      <div>
        {status === 'loading' ? (
          <span style={{ color: '#999' }}>Loading...</span>
        ) : session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#666' }}>{session.user?.name}</span>
            <button
              onClick={() => signOut({ redirectTo: '/' })}
              style={{
                padding: '8px 16px',
                background: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            style={{
              padding: '8px 16px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-block'
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
