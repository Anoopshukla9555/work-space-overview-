import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, Image, PenLine, StickyNote } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';

export const PURPOSES = [
  { id: 'shayari', icon: PenLine, title: 'Shayari & Posts', text: 'Write Hindi and English Shayari, quotes and captions. Keep drafts, sort by Love, Sad, Motivation, Friendship or Life.' },
  { id: 'documents', icon: FileText, title: 'Document Store', text: 'Upload PDF, DOC, DOCX, TXT and images. Organize them in folders, then search, preview and download.' },
  { id: 'photos', icon: Image, title: 'Photos & Memories', text: 'Store photos in albums with titles, descriptions and dates, and browse them in a gallery.' },
  { id: 'notes', icon: StickyNote, title: 'Important Notes & Personal Space', text: 'Write notes, reminders and ideas. Add categories, pin the important ones and search them.' },
];
export default function Purpose({ embedded }) {
  const { user, setUser } = useAuth(); const nav = useNavigate();
  const [sel, setSel] = useState(user.purposes); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const save = async () => {
    setErr(''); setBusy(true);
    try { const d = await api('/auth/purposes', 'PUT', { purposes: sel }); setUser(d.user); nav('/app'); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <main className={embedded ? '' : 'mx-auto max-w-4xl px-5 py-14'}>
      <h1 className="text-3xl font-extrabold tracking-tight">What would you like to create your account for?</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Choose one or more. You can change this later in Settings.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2" role="group" aria-label="Account purposes">
        {PURPOSES.map(({ id, icon: Icon, title, text }) => {
          const on = sel.includes(id);
          return (
            <button key={id} onClick={() => toggle(id)} aria-pressed={on}
              className={`card relative p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${on ? '!border-brand-500 ring-2 ring-brand-500/40' : ''}`}>
              {on && <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white"><Check size={14} /></span>}
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-100"><Icon size={20} /></span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{text}</p>
            </button>
          );
        })}
      </div>
      {err && <p role="alert" className="mt-4 text-sm text-red-600">{err}</p>}
      <button onClick={save} disabled={busy || !sel.length} className="btn-primary mt-8 px-8">{busy ? 'Saving…' : embedded ? 'Save changes' : 'Continue'}</button>
    </main>
  );
}
