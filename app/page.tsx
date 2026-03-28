'use client';
import Link from 'next/link';

export default function Home() {
  const languages = [
    { name: 'Python', color: 'is-primary' },
    { name: 'Java', color: 'is-success' },
    { name: 'C++', color: 'is-error' },
    { name: 'C', color: 'is-warning' }
  ];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-10">
      <section className="nes-container with-title is-centered is-dark">
        <p className="title">PORTFOLIO.EXE</p>
        <p className="mb-10 text-sm">SELECT A LANGUAGE MODULE TO BEGIN</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {languages.map((lang) => (
            <Link href={`/projects/${lang.name.toLowerCase()}`} key={lang.name}>
              <button type="button" className={`nes-btn ${lang.color} w-full`}>
                {lang.name}
              </button>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <Link href="/admin" className="nes-text is-disabled text-xs">ADMIN_LOGIN</Link>
      </div>
    </main>
  );
}