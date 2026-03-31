'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LanguageProjects() {
  const { language } = useParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('language', language);
      
      setProjects(data || []);
      setLoading(false);
    }
    if (language) fetchProjects();
  }, [language]);

  return (
    <div className="p-4 min-h-screen bg-gray-900 text-white flex flex-col items-center font-mono">
      <h1 className="nes-text is-error mb-6 underline capitalize text-[11px]">
        {language} MODULES_AVAILABLE
      </h1>
      
      <div className="w-full max-w-2xl space-y-4">
        {loading ? (
          <p className="nes-text is-disabled text-[7px]">SCANNING_DATABASE...</p>
        ) : projects.length > 0 ? (
          projects.map((p) => (
            <div key={p.id} className="nes-container with-title is-dark">
              <p className="title text-[7px]">{p.title}</p>
              <p className="text-[6px] mb-4 text-gray-400">{p.description || "No mission brief provided."}</p>
              <Link href={`/project/${p.id}`}>
                <button className="nes-btn is-primary text-[7px]">RUN</button>
              </Link>
            </div>
          ))
        ) : (
          <div className="nes-container is-dark is-centered">
            <p className="mb-3 text-[7px]">NO DATA FOUND FOR THIS SECTOR.</p>
            <Link href="/" className="nes-btn is-error text-[7px]">RETURN_TO_BASE</Link>
          </div>
        )}
      </div>
    </div>
  );
}