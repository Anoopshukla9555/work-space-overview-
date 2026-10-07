import { Link } from 'react-router-dom';
import { FileText, Image, PenLine, StickyNote, Moon, Sun, Lock } from 'lucide-react';
import { useTheme } from '../auth';

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white"><Lock size={18} /></span>
    My Personal Space
  </Link>
);
const features = [
  [FileText, 'Document store', 'Keep PDFs, Word files and scans in folders you name, with search and preview.'],
  [Image, 'Photo gallery', 'Albums, titles and dates for the pictures you want to keep.'],
  [PenLine, 'Shayari & posts', 'Write in Hindi or English, pick a style, save drafts and export as an image.'],
  [StickyNote, 'Personal notes', 'Pin what matters, tag it, and let it save itself as you type.'],
];
export default function Landing() {
  const [dark, toggle] = useTheme();
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="drift pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-72 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <button onClick={toggle} aria-label="Toggle dark mode" className="btn-ghost !p-2.5">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/signup" className="btn-primary">Sign up</Link>
        </nav>
      </header>
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 md:pt-24">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">Your Documents, Your Memories, Your Space.</h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">One private place for your files, photos, Shayari and notes. Everything stays in your own account, and only you can open it.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup" className="btn-primary px-6 py-3">Create your space</Link>
          <Link to="/login" className="btn-ghost px-6 py-3">I already have an account</Link>
        </div>
        <div className="mt-14 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 md:max-w-md">
          <p className="font-hindi text-xl leading-relaxed">कुछ यादें लफ़्ज़ों में रहती हैं,<br />कुछ तस्वीरों में, कुछ दिल में।</p>
          <p className="mt-3 text-sm text-slate-500">A Shayari draft, saved in My Personal Space</p>
        </div>
      </section>
      <section className="relative mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-2xl font-bold md:text-3xl">Everything personal, in one place</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([Icon, t, d]) => (
            <div key={t} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-100"><Icon size={20} /></span>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">© {new Date().getFullYear()} My Personal Space</footer>
    </div>
  );
}
