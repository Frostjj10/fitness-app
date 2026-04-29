import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/schedule', label: 'Schedule', icon: 'calendar' },
  { path: '/log', label: 'Log', icon: 'activity' },
  { path: '/progress', label: 'Progress', icon: 'chart' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

function NavIcon({ variant, className }) {
  const props = { className: className || 'w-5 h-5', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter' };
  if (variant === 'home') return <svg {...props} viewBox="0 0 24 24"><path d="M3 9.5L12 4l9 5.5M4 10v9a1 1 0 001 1h14a1 1 0 001-1v-9M9 21v-5a3 3 0 016 0v5"/></svg>;
  if (variant === 'calendar') return <svg {...props} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
  if (variant === 'activity') return <svg {...props} viewBox="0 0 24 24"><path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/></svg>;
  if (variant === 'chart') return <svg {...props} viewBox="0 0 24 24"><path d="M3 3h18v18H3z" rx="0"/><path d="M7 14h4v7M13 10h4v11M17 6h4v15"/></svg>;
  if (variant === 'settings') return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
  return null;
}

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed h-full z-10 lg:w-16 xl:w-56"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="px-4 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
              </svg>
            </div>
            <h1
              className="text-lg font-bold tracking-tight text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              FitTrack
            </h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-0.5 font-bold text-sm transition-all relative
                  ${active ? 'text-black' : 'text-white hover:opacity-80'}
                `}
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1"
                    style={{ height: '24px', background: 'var(--accent)' }}
                  />
                )}
                <NavIcon variant={item.icon} className="w-5 h-5 shrink-0" />
                <span className="hidden xl:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Account */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 px-4"
            style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Account
          </div>
          <div
            className="text-sm font-bold px-4 mb-2 text-white truncate"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {user?.name || 'User'}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-all hover:opacity-80"
              style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              <span className="hidden xl:block">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M14.5 4l-5 6-3 5 6.5 6L20 10l-5.5-6z"/>
            </svg>
          </div>
          <span className="font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>FitTrack</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
          style={{ color: 'var(--text-dim)' }}
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed top-14 left-0 right-0 z-20"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <nav className="p-2">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 font-bold text-sm
                    ${active ? 'text-black' : 'text-white'}
                  `}
                  style={{
                    background: active ? 'var(--accent)' : 'transparent',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  <NavIcon variant={item.icon} className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div
              className="border-t mt-2 pt-2 px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Account
              </div>
              <div className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name || 'User'}</div>
            </div>
            {onLogout && (
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-all"
                style={{ color: 'var(--text-dim)', fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                <span>Sign Out</span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main
        className="flex-1 pt-14 pb-20 lg:pt-0 lg:pb-0"
        style={{ marginLeft: '0' }}
      >
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 safe-area-inset-bottom"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full gap-0.5 ${active ? 'text-black' : ''}`}
                style={{ background: active ? 'var(--accent)' : 'transparent' }}
              >
                <NavIcon variant={item.icon} className="w-5 h-5" />
                <span
                  className="text-[10px] font-bold"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? '#000' : 'var(--text-dim)' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}