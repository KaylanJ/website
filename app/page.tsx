'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ContactForm from '@/app/components/ContactForm';

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetching projects and the latest 3 announcements
      const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      const { data: nData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3);
      
      setProjects(pData || []);
      setNews(nData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-white nes-text">INITIALIZING_SYSTEM...</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-10">
      
      {/* 1. HEADER SECTION */}
      <header className="flex justify-between items-center border-b-4 border-gray-700 pb-4">
        <div>
          <h1 className="nes-text is-success text-2xl">KAYLAN_J // PORTFOLIO</h1>
          <p className="text-[10px] text-gray-400">STUDENT @ UNB | MATH & CS</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin" className="nes-btn is-error text-[8px]">ADMIN_PANEL</Link>
        </div>
      </header>

      {/* 2. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: NEWS & STATUS */}
        <div className="lg:col-span-1 space-y-6">
          <section className="nes-container with-title is-dark">
            <p className="title">BROADCASTS</p>
            <div className="space-y-4">
              {news.length > 0 ? news.map(item => (
                <div key={item.id} className="border-b border-gray-800 pb-2">
                  <p className="nes-text is-warning text-[10px] underline">{item.title}</p>
                  <p className="text-[8px] leading-relaxed text-gray-300">{item.content}</p>
                  <span className="text-[6px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              )) : <p className="text-[8px]">NO_LOGS_FOUND.</p>}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">STATUS</p>
            <ul className="nes-list is-disc text-[8px] space-y-2">
              <li>Next.js App: ONLINE</li>
              <li>JDoodle API: CONNECTED</li>
              <li>Supabase DB: ACTIVE</li>
              <li>Vercel Analytics: ENABLED</li>
            </ul>
          </section>
        </div>

        {/* RIGHT COLUMN: PROJECT GRID */}
        <div className="lg:col-span-2">
          <h3 className="nes-text is-primary mb-4 underline text-sm">AVAILABLE_MODULES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => (
              <Link href={`/view-project/${project.id}`} key={project.id} className="no-underline">
                <div className="nes-container is-dark is-rounded hover:border-yellow-400 transition-colors cursor-pointer h-full">
                  <p className="text-xs text-yellow-400 uppercase font-bold">{project.title}</p>
                  <p className="text-[8px] text-gray-400 mt-2 line-clamp-2">{project.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="nes-badge">
                      <span className="is-success text-[6px] uppercase px-1">{project.language}</span>
                    </span>
                    <span className="text-[8px] text-blue-400 font-bold">OPEN_LAB &gt;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CONTACT SECTION (The Relay Protocol) */}
      <div id="contact" className="py-10 border-t-2 border-gray-800">
        <h2 className="text-center nes-text is-success text-xs mb-8 underline uppercase tracking-widest">
          Establish_Secure_Uplink
        </h2>
        <div className="max-w-2xl mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="text-center pt-10 pb-4">
        <p className="text-[8px] text-gray-600 uppercase">
          © 2026 KAYLAN_J // BUILT_WITH_NEXTJS_AND_SUPABASE
        </p>
      </footer>
      
    </div>
  );
}