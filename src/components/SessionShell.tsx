import React, { useEffect, useRef, useState } from 'react';
import { Activity, ArrowLeft, LockKeyhole, LogOut, Users, Video } from 'lucide-react';

type User = { id: string; username: string; role: 'user' | 'admin' };
type SessionRow = { id: string; alias: string; isYou: boolean; online: boolean; lastSeen: number; aiRequests: number; activity: string; username?: string; role?: string; ip?: string };
type Event = { eventId: string; username: string; ip: string; activity: string; time: number };
type Dashboard = { users: SessionRow[]; events: Event[]; online: number; ownIp: string; updatedAt: number; admin: boolean; limit: number };

async function access(action: string, body?: Record<string, unknown>) {
  const res = await fetch(body ? '/api/access' : `/api/access?action=${action}`, {
    method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
    ...(body ? { headers: { 'Content-Type': 'application/json', 'X-J2-Request': '1' }, body: JSON.stringify({ ...body, action }) } : {}),
  });
  const data = await res.json().catch(() => ({ error: 'The server is unavailable. Please try again.' }));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Unable to complete the request.'), { status: res.status });
  return data;
}

const dateTime = (time: number) => new Date(time).toLocaleString();

export function SessionShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const activity = useRef('workspace');

  const loadSession = async () => {
    setLoading(true); setError('');
    try { setUser((await access('me')).user); }
    catch (err: any) { if (err.status !== 401) setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadSession(); }, []);
  useEffect(() => {
    const listener = (event: globalThis.Event) => { activity.current = (event as CustomEvent<string>).detail; };
    window.addEventListener('j2-activity', listener);
    return () => window.removeEventListener('j2-activity', listener);
  }, []);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let running = false;
    const refresh = async () => {
      if (running || document.visibilityState === 'hidden') return;
      running = true;
      try {
        await access('heartbeat', { activity: showDashboard ? 'dashboard' : activity.current });
        const data = await access('dashboard');
        if (!cancelled) { setDashboard(data); setDashboardError(''); }
      } catch (err: any) {
        if (!cancelled) {
          if (err.status === 401) { setUser(null); setDashboard(null); setPassword(''); setError('Your session expired. Please sign in again.'); }
          else setDashboardError(err.message);
        }
      } finally { running = false; }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [user?.id, showDashboard]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const data = await access('login', { username, password }); setUser(data.user); setPassword(''); setDashboard(null); }
    catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await access('logout', {}); setUser(null); setDashboard(null); setShowDashboard(false); setError(''); }
    catch (err: any) { setDashboardError(err.message); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="min-h-screen bg-zinc-950 text-zinc-200 grid place-items-center"><p role="status">Checking your session…</p></main>;
  if (!user) return <main className="min-h-screen bg-[#09090b] text-zinc-100 grid place-items-center p-6">
    <div className="w-full max-w-md">
      <div className="flex items-center gap-3 mb-8"><Video className="text-blue-400" size={32}/><span className="text-2xl font-bold">J2 Clips</span></div>
      <form onSubmit={login} className="border border-zinc-800 bg-zinc-900/70 rounded-3xl p-6 sm:p-8 space-y-5">
        <LockKeyhole className="text-blue-400" size={28}/>
        <div><h1 className="text-2xl font-semibold">Sign in to your workspace</h1><p className="text-zinc-400 mt-2">Choose any username and enter your access password.</p></div>
        <label className="block text-sm font-medium">Username<input name="username" autoComplete="username" required maxLength={40} value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"/></label>
        <label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"/></label>
        {error && <p role="alert" className="text-amber-300 text-sm">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 font-semibold disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-sm leading-relaxed text-zinc-400">Signed-in users can see anonymous online sessions and request counts. Admins can see usernames, IP addresses, and app actions for up to 24 hours. Video content and prompts are not included. Sessions last 12 hours.</p>
      </form>
    </div>
  </main>;

  return <div className="min-h-screen bg-[#09090b] text-zinc-100">
    <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap text-sm">
        <div className="flex items-center gap-2 min-w-0"><span className="font-semibold break-all">{user.username}</span><span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">{user.role === 'admin' ? 'Admin' : 'User'}</span></div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={()=>setShowDashboard(!showDashboard)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600/15 text-blue-300 px-3 py-2 hover:bg-blue-600/25">{showDashboard ? <ArrowLeft size={16}/> : <Users size={16}/>} {showDashboard ? 'Back to workspace' : `Live users${dashboard && !dashboardError ? ` · ${dashboard.online}` : ''}`}</button>
          <button onClick={logout} disabled={busy} className="inline-flex gap-2 items-center text-zinc-300 hover:text-white disabled:opacity-50"><LogOut size={16}/> Sign out</button>
        </div>
      </div>
    </div>
    {dashboardError && <div role="alert" className="max-w-7xl mx-auto px-4 py-3 text-sm text-amber-300">Live activity is unavailable: {dashboardError} Previously loaded data may be out of date.</div>}
    <div hidden={showDashboard}>{children}</div>
    {showDashboard && <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap"><div><h1 className="text-3xl font-semibold">Live users</h1><p className="text-zinc-400 mt-2">{user.role === 'admin' ? 'Session activity from the last 24 hours.' : 'Anonymous sessions currently using the app.'}</p></div><span className="text-sm text-zinc-400 flex items-center gap-2"><Activity size={16}/> Refreshes every 30 seconds</span></div>
      {!dashboard ? <p role="status">{dashboardError ? 'Waiting for the activity service to recover.' : 'Loading live activity…'}</p> : <>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="border border-blue-500/30 bg-blue-600/10 rounded-2xl p-5"><p className="text-blue-300 text-sm">{dashboardError ? 'Last known online sessions' : 'Online sessions'}</p><p className="text-4xl font-semibold mt-2">{dashboard.online}</p><p className="text-zinc-400 text-sm mt-2">Seen within the last 2 minutes</p></div>
          <div className="border border-zinc-800 rounded-2xl p-5"><p className="text-zinc-400 text-sm">Your public IP</p><p className="font-mono text-lg mt-3 break-all">{dashboard.ownIp}</p><p className="text-zinc-500 text-sm mt-2">Shared networks may use the same IP.</p></div>
          <div className="border border-zinc-800 rounded-2xl p-5"><p className="text-zinc-400 text-sm">Last updated</p><p className="text-lg mt-3">{dateTime(dashboard.updatedAt)}</p><p className="text-zinc-500 text-sm mt-2">Counts sessions, not unique people.</p></div>
        </div>
        <div className="rounded-2xl border border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm text-left"><caption className="text-left px-5 py-4 text-zinc-400">{dashboard.admin ? 'Recent sessions · up to 200 shown' : 'Online sessions · up to 200 shown'}</caption><thead className="bg-zinc-900 text-zinc-400"><tr>{['Session','Status',...(dashboard.admin ? ['IP address'] : []),'Activity','Last seen','AI requests'].map(h=><th key={h} scope="col" className="px-5 py-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{dashboard.users.map(row=><tr key={row.id} className="border-t border-zinc-800"><td className="px-5 py-4"><span className="break-all">{dashboard.admin ? row.username : row.alias}</span>{row.isYou && <span className="text-blue-400 ml-2">You</span>}{dashboard.admin && <span className="block text-zinc-500 text-xs mt-1">{row.alias} · {row.role}</span>}</td><td className="px-5 py-4"><span className={row.online ? 'text-emerald-400' : 'text-zinc-500'}>{row.online ? 'Online' : 'Offline'}</span></td>{dashboard.admin && <td className="px-5 py-4 font-mono">{row.ip}</td>}<td className="px-5 py-4">{row.activity}</td><td className="px-5 py-4 whitespace-nowrap text-zinc-400">{dateTime(row.lastSeen)}</td><td className="px-5 py-4">{row.aiRequests}</td></tr>)}</tbody></table>
          {!dashboard.users.length && <p className="px-5 py-8 text-zinc-400">No active sessions to show yet.</p>}
        </div>
        {dashboard.admin && <section className="rounded-2xl border border-zinc-800 p-5"><h2 className="text-xl font-semibold">Activity log</h2><p className="text-sm text-zinc-400 mt-1">Latest 100 sign-ins, sign-outs, section changes, and AI requests. Request counts include attempts, not only successful generations.</p><div className="divide-y divide-zinc-800 mt-4">{dashboard.events.map(event=><div key={event.eventId} className="py-4 flex gap-3 flex-wrap justify-between"><div><p><span className="font-medium break-all">{event.username}</span><span className="text-zinc-400"> · {event.activity}</span></p><p className="text-sm font-mono text-zinc-500 mt-1">{event.ip}</p></div><time className="text-sm text-zinc-500" dateTime={new Date(event.time).toISOString()}>{dateTime(event.time)}</time></div>)}{!dashboard.events.length && <p className="text-zinc-400 py-4">No activity recorded yet.</p>}</div></section>}
      </>}
    </main>}
  </div>;
}
