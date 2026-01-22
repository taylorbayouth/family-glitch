'use client';

import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { APP_VERSION, APP_TAGLINE } from '@/lib/constants';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  // If user is already signed in, redirect to setup
  useEffect(() => {
    if (session) {
      router.push('/setup');
    }
  }, [session, router]);

  return (
    <div className="min-h-dvh flex flex-col bg-void relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-glitch/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-mint/10 rounded-full blur-[120px]" />

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-between px-6 pt-10 pb-8 max-w-md mx-auto w-full relative z-10">
        <section className="flex-1 flex flex-col justify-center space-y-6">
          {/* Logo animation */}
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-[0.35em] text-steel-500">
              <span className="h-px w-6 bg-steel-700" />
              <span>Pass &amp; Play</span>
              <span className="h-px w-6 bg-steel-700" />
            </div>

            {/* Animated eye icon */}
            <motion.div
              className="w-20 h-20 mx-auto relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-glitch/40 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-2 rounded-full border border-glitch-bright/30 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-glitch to-glitch-deep" />
              <div className="absolute inset-6 rounded-full bg-void flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-mint animate-pulse" />
              </div>
            </motion.div>

            {/* Title */}
            <h1
              className="text-[clamp(2.8rem,10vw,4.6rem)] font-black text-frost tracking-tight leading-none glitch-text"
              data-text="FAMILY GLITCH"
            >
              FAMILY<br />GLITCH
            </h1>

            {/* Subtitle */}
            <div className="flex items-center justify-center gap-3 text-steel-400">
              <div className="h-px w-8 bg-steel-700" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] font-semibold">
                AI Party Game
              </span>
              <div className="h-px w-8 bg-steel-700" />
            </div>
          </motion.div>

          {/* Description */}
          <motion.div
            className="glass rounded-2xl p-6 relative overflow-hidden border border-steel-800/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-glitch/60 to-transparent" />
            <p className="text-frost/90 text-base leading-relaxed mb-3">
              A snarky AI host analyzes your dinner table dynamics in real-time.
              <span className="text-glitch-bright font-semibold"> 15 minutes</span>.
              One phone. Pass and play.
            </p>
            <p className="text-steel-400 text-sm">
              <span className="text-alert">Cards Against Humanity</span> meets{' '}
              <span className="text-glitch-bright">Black Mirror</span>
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Players', value: '3-7' },
                { label: 'Length', value: '15 min' },
                { label: 'Device', value: '1 phone' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-steel-800/70 bg-void-light/60 px-2 py-2"
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest text-steel-500">
                    {item.label}
                  </div>
                  <div className="text-xs font-bold text-frost">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { step: '01', title: 'Setup', detail: 'Roster' },
                { step: '02', title: 'Pass', detail: 'Question' },
                { step: '03', title: 'Reveal', detail: 'Commentary' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-steel-800/70 bg-void-light/40 px-3 py-2 text-center"
                >
                  <div className="text-[10px] font-mono text-steel-500">
                    {item.step}
                  </div>
                  <div className="text-xs font-semibold text-frost">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-steel-500">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-steel-800/70 bg-void-light/50 p-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/40 to-transparent" />
              <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-glitch/15 blur-2xl" />
              <div className="rounded-2xl border border-steel-800/80 bg-void/80 p-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-steel-500 uppercase tracking-[0.25em]">
                  <span>Live Turn</span>
                  <span>00:12</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-frost">
                  Quick: Pizza or Tacos?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold">
                  <div className="rounded-lg border border-glitch/60 bg-glitch/30 px-2 py-2 text-center text-frost">
                    Pizza
                  </div>
                  <div className="rounded-lg border border-steel-700 bg-void px-2 py-2 text-center text-steel-300">
                    Tacos
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-steel-400">
                  The Glitch: &quot;You chose chaos. Respect.&quot;
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Bottom section - CTA */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Google Sign In Button */}
          <button
            onClick={handleSignIn}
            className="w-full relative overflow-hidden text-frost font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-strong active:scale-[0.98] border border-glitch/40"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-glitch to-glitch-deep opacity-90" />
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-mint/30 blur-2xl" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              {/* Google Icon */}
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <span className="text-lg">Continue with Google</span>
            </div>
          </button>

          {/* Terms */}
          <p className="text-center text-xs text-steel-600 font-mono">
            By continuing, you agree to let The Glitch analyze you.
          </p>

          {/* Version */}
          <div className="text-center pt-4">
            <span className="inline-block px-3 py-1.5 rounded-full glass border border-steel-800 text-xs text-steel-500 font-mono">
              v{APP_VERSION} &middot; {APP_TAGLINE}
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
