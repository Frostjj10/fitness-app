import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        setMessage('Account created! Check your email to confirm, then sign in.');
        setMode('login');
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else if (data.user) {
        window.location.reload();
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(var(--border) 1px, transparent 1px),
              linear-gradient(90deg, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Decorative diagonal stripe */}
        <div
          className="absolute top-0 right-0 w-32 h-full"
          style={{ background: 'var(--accent)', opacity: 0.08 }}
        />

        {/* Top logo */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
              </svg>
            </div>
            <span
              className="font-bold text-white"
              style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', letterSpacing: '0.05em' }}
            >
              FitTrack
            </span>
          </div>
        </div>

        {/* Centered vertical text block */}
        <div className="relative z-10 px-10">
          <div
            className="font-extrabold text-white leading-none"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(4rem, 8vw, 7rem)', letterSpacing: '-0.04em', lineHeight: 0.85 }}
          >
            <div>TRAIN</div>
            <div style={{ color: 'var(--accent)' }}>YOUR</div>
            <div>WAY.</div>
          </div>
          <div
            className="mt-8 text-sm font-medium leading-relaxed max-w-xs"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.6 }}
          >
            AI-powered programming built around your goals, experience, and available equipment.
          </div>
          <div className="mt-12 flex items-center gap-4">
            <div className="w-8 h-px" style={{ background: 'var(--accent)' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.2em' }}
            >
              Free forever
            </span>
          </div>
        </div>

        {/* Bottom decorative */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-6">
            {['Strength', 'Hypertrophy', 'Endurance'].map(g => (
              <div key={g} className="text-center">
                <div
                  className="text-2xl font-extrabold text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  —
                </div>
                <div
                  className="text-[10px] font-bold uppercase tracking-widest mt-1"
                  style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.1em' }}
                >
                  {g}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
              </svg>
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>FitTrack</span>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p
              className="text-sm font-medium mt-2"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase' }}
            >
              {mode === 'login' ? 'Welcome back to FitTrack' : 'Start your training journey'}
            </p>
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input"
                  placeholder="Alex Johnson"
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="alex@example.com"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 text-sm font-bold"
                style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#FF6B6B' }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="px-4 py-3 text-sm font-bold"
                style={{ background: 'rgba(202,255,0,0.1)', border: '1px solid rgba(202,255,0,0.3)', color: 'var(--accent)' }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="btn-primary w-full"
              style={{
                background: 'var(--accent)',
                color: '#000',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '1rem',
                padding: '16px 24px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-xs font-bold uppercase tracking-widest"
                style={{ background: 'var(--bg)', color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                or
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              setLoading(true);
              setError(null);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
              });
              if (error) setError(error.message);
              setLoading(false);
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 font-bold text-sm transition-all"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontFamily: 'Barlow Condensed, sans-serif',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
              className="text-sm font-bold transition-all hover:opacity-80"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
            >
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--accent)' }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
