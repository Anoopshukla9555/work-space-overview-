import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAuth } from '../auth';
import { Logo } from './Landing';

const copy = {
  login: ['Welcome back', 'Log in'], signup: ['Create your account', 'Sign up'],
  forgot: ['Reset your password', 'Send reset link'], reset: ['Choose a new password', 'Save password'], verify: ['Verifying your email', ''],
};
export default function AuthPage({ mode }) {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const [q] = useSearchParams(); const nav = useNavigate(); const { setUser } = useAuth();
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const done = d => { setUser(d.user); nav(d.user.onboarded ? '/app' : '/welcome'); };

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'login') done(await api('/auth/login', 'POST', f));
      if (mode === 'signup') done(await api('/auth/register', 'POST', f));
      if (mode === 'forgot') { await api('/auth/forgot', 'POST', { email: f.email }); setMsg('If an account uses that email, a reset link is on its way.'); }
      if (mode === 'reset') { await api('/auth/reset', 'POST', { email: q.get('email'), token: q.get('token'), password: f.password }); nav('/login'); }
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const verify = async () => {
    try { await api('/auth/verify', 'POST', { email: q.get('email'), token: q.get('token') }); setMsg('Your email is verified. You can close this tab or log in.'); }
    catch (x) { setErr(x.message); }
  };
  const google = async r => { try { done(await api('/auth/google', 'POST', { credential: r.credential })); } catch (x) { setErr(x.message); } };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card p-7">
          <h1 className="text-2xl font-bold">{copy[mode][0]}</h1>
          {mode === 'verify' ? (
            <div className="mt-5">
              {!msg && !err && <button onClick={verify} className="btn-primary">Verify my email</button>}
              {msg && <p role="status" className="text-sm text-emerald-600">{msg}</p>}
              {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
              <Link to="/login" className="mt-4 block text-sm text-brand-600">Go to log in</Link>
            </div>
          ) : (
            <>
              {(mode === 'login' || mode === 'signup') && (
                <>
                  <div className="mt-5 flex justify-center"><GoogleLogin onSuccess={google} onError={() => setErr('Google sign-in failed. Please try again.')} text="continue_with" shape="pill" /></div>
                  <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />or use email<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /></div>
                </>
              )}
              <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
                {mode === 'signup' && <label className="block text-sm font-medium">Name<input className="input mt-1" value={f.name} onChange={set('name')} autoComplete="name" required /></label>}
                {mode !== 'reset' && <label className="block text-sm font-medium">Email<input className="input mt-1" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>}
                {mode !== 'forgot' && <label className="block text-sm font-medium">{mode === 'reset' ? 'New password' : 'Password'}<input className="input mt-1" type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></label>}
                {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
                {msg && <p role="status" className="text-sm text-emerald-600">{msg}</p>}
                <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : copy[mode][1]}</button>
              </form>
              <div className="mt-5 flex justify-between text-sm text-slate-500">
                {mode === 'login' && <><Link to="/forgot" className="hover:text-brand-600">Forgot password?</Link><Link to="/signup" className="hover:text-brand-600">Create account</Link></>}
                {mode === 'signup' && <Link to="/login" className="hover:text-brand-600">Already have an account? Log in</Link>}
                {(mode === 'forgot' || mode === 'reset') && <Link to="/login" className="hover:text-brand-600">Back to log in</Link>}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
