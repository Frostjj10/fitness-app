import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import SchedulePage from './pages/SchedulePage';
import LogWorkout from './pages/LogWorkout';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Layout from './components/Layout';

export default function App() {
  const [authUser, setAuthUser] = useState(null); // Supabase auth user
  const [profile, setProfile] = useState(null);  // Database profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  }

  async function handleProfileComplete(profileData) {
    setProfile(profileData);
    // Reload to pick up the new profile
    window.location.reload();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Not logged in — show auth page
  if (!authUser) {
    return <Auth />;
  }

  // Logged in but no profile OR profile incomplete (no goal set) — show onboarding
  if (!profile || !profile.goal) {
    return <Onboarding user={authUser} onComplete={handleProfileComplete} />;
  }

  return (
    <BrowserRouter>
      <Layout user={profile} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={profile} />} />
          <Route path="/schedule" element={<SchedulePage user={profile} />} />
          <Route path="/log" element={<LogWorkout user={profile} />} />
          <Route path="/progress" element={<Progress user={profile} />} />
          <Route path="/settings" element={<Settings user={profile} onUpdate={setProfile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
