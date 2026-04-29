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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background grid lines */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.3,
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo mark */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-16 h-16 mb-5"
            style={{ background: 'var(--accent)' }}
          >
            <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
            </svg>
          </div>
          <h1
            className="text-4xl font-extrabold text-white tracking-tighter"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            FitTrack
          </h1>
          <p
            className="text-sm mt-3 font-medium"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            {mode === 'login' ? '— Sign in —' : '— Create account —'}
          </p>
        </div>

        <div
          className="p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
              className="btn-primary w-full"
              style={{
                background: 'var(--accent)',
                color: '#000',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '1rem',
                padding: '14px 24px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

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

        <p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}