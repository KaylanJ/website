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
    <div className="p-10 min-h-screen bg-gray-900 text-white flex flex-col items-center font-mono">
      <h1 className="nes-text is-error mb-10 underline capitalize text-xl">
        {language} MODULES_AVAILABLE
      </h1>
      
      <div className="w-full max-w-2xl space-y-8">
        {loading ? (
          <p className="nes-text is-disabled">SCANNING_DATABASE...</p>
        ) : projects.length > 0 ? (
          projects.map((p) => (
            <div key={p.id} className="nes-container with-title is-dark">
              <p className="title">{p.title}</p>
              <p className="text-xs mb-6 text-gray-400">{p.description || "No mission brief provided."}</p>
              <Link href={`/project/${p.id}`}>
                <button className="nes-btn is-primary text-xs">INITIALIZE_RUN</button>
              </Link>
            </div>
          ))
        ) : (
          <div className="nes-container is-dark is-centered">
            <p className="mb-4 text-xs">NO DATA FOUND FOR THIS SECTOR.</p>
            <Link href="/" className="nes-btn is-error text-xs">RETURN_TO_BASE</Link>
          </div>
        )}
      </div>
    </div>
  );
}