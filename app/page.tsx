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
      <header className="flex justify-between items-center border-b-4 border-gray-700 pb-2">
        <div>
          <h1 className="nes-text is-success text-xl">KAYLAN_J // PORTFOLIO</h1>
          <p className="text-[9px] text-gray-400">STUDENT @ UNB | MATH & CS</p>
        </div>
        <Link href="/admin" className="nes-btn is-error text-[8px]">ADMIN</Link>
      </header>

      {/* 2. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* LEFT COLUMN: NEWS */}
        <div className="space-y-4">
          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">BROADCASTS</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {news.length > 0 ? news.map(item => (
                <div key={item.id} className="border-b border-gray-800 pb-1">
                  <p className="nes-text is-warning text-[8px] underline">{item.title}</p>
                  <p className="text-[7px] leading-tight text-gray-300 line-clamp-2">{item.content}</p>
                  <span className="text-[6px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              )) : <p className="text-[7px]">NO_LOGS</p>}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMNS: PROJECTS & STATUS */}
        <div className="lg:col-span-3">
          <h3 className="nes-text is-primary mb-2 underline text-[10px]">AVAILABLE_MODULES</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {projects.map(project => (
              <Link href={`/view-project/${project.id}`} key={project.id} className="no-underline">
                <div className="nes-container is-dark is-rounded hover:border-yellow-400 transition-colors cursor-pointer h-full">
                  <p className="text-[8px] text-yellow-400 uppercase truncate">{project.title}</p>
                  <p className="text-[6px] text-gray-400 mt-1 line-clamp-1">{project.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="nes-badge">
                      <span className="is-success text-[6px] uppercase px-0.5">{project.language}</span>
                    </span>
                    <span className="text-[7px] text-blue-400">&gt;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* STATUS SECTION */}
          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">STATUS</p>
            <ul className="nes-list is-disc text-[7px] space-y-1">
              <li>Next.js: ONLINE</li>
              <li>JDoodle: CONNECTED</li>
              <li>Supabase: ACTIVE</li>
            </ul>
          </section>
        </div>
      </div>

      {/* 3. CONTACT SECTION */}
      <div id="contact" className="py-6 border-t-2 border-gray-800">
        <h2 className="text-center nes-text is-success text-[10px] mb-4 underline uppercase tracking-wide">
          Secure_Uplink
        </h2>
        <div className="max-w-2xl mx-auto">
          <ContactForm />
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="text-center py-4">
        <p className="text-[7px] text-gray-600 uppercase">
          © 2026 KAYLAN_J // NEXTJS_SUPABASE
        </p>
      </footer>
      
    </div>
  );
}