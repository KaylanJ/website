'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const ADMIN_EMAIL = 'kay31286@gmail.com'; 

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- DATA STATES ---
  const [news, setNews] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  
  // --- FORM STATES ---
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("python");
  const [baseCode, setBaseCode] = useState("");
  const [testCases, setTestCases] = useState([{ name: "", input: "", expected: "", file_name: "", file_content: "" }]);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === ADMIN_EMAIL) {
        setIsLoggedIn(true);
        refreshAll();
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const refreshAll = async () => {
    const { data: pData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const { data: nData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    const { data: mData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    setProjects(pData || []);
    setNews(nData || []);
    setInbox(mData || []);
  };

  // --- CREATE ACTIONS ---
  const saveProject = async () => {
    setLoading(true);
    const { data: pData, error: pErr } = await supabase.from('projects').insert([{ title, language, base_code: baseCode }]).select();
    if (pErr) return alert("DEPLOYMENT_FAILED");
    
    // Attach project_id to test cases and insert
    const finalTests = testCases.map(tc => ({ ...tc, project_id: pData[0].id }));
    await supabase.from('test_cases').insert(finalTests);
    
    alert("MODULE_DEPLOYED_SUCCESSFULLY");
    setLoading(false);
    refreshAll();
  };

  const postNews = async () => {
    const { error } = await supabase.from('announcements').insert([{ title: newsTitle, content: newsContent }]);
    if (error) alert("BROADCAST_FAILED");
    else { 
      alert("BROADCAST_LIVE"); 
      setNewsTitle(""); 
      setNewsContent(""); 
      refreshAll(); 
    }
  };

  // --- DELETE ACTIONS ---
  const deleteProject = async (id: string) => {
    if (confirm("ERASE_PROJECT_DATA?")) {
      await supabase.from('projects').delete().eq('id', id);
      refreshAll();
    }
  };

  const deleteNews = async (id: string) => {
    if (confirm("PURGE_BROADCAST_LOG?")) {
      await supabase.from('announcements').delete().eq('id', id);
      refreshAll();
    }
  };

  const deleteMessage = async (id: string) => {
    if (confirm("DELETE_MESSAGE_LOG?")) {
      await supabase.from('messages').delete().eq('id', id);
      refreshAll();
    }
  };

  if (loading) return <div className="p-20 text-white nes-text">BOOTING_CORE...</div>;
  if (!isLoggedIn) return <div className="p-20 text-white nes-text">UNAUTHORIZED_ACCESS</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-8">
      
      <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
        <Link href="/" className="nes-btn is-error text-[8px]">&lt; DISCONNECT</Link>
        <p className="nes-text is-primary text-[10px]">ROOT@ADMIN_TERMINAL:~$</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* LEFT COLUMN: MANAGEMENT */}
        <div className="space-y-10">
          
          <section className="nes-container with-title is-dark">
            <p className="title">SECURE_INBOX</p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {inbox.length > 0 ? inbox.map(m => (
                <div key={m.id} className="p-3 border-l-4 border-blue-500 bg-gray-800/40">
                  <div className="flex justify-between items-start">
                    <div className="text-[8px] space-y-1">
                      <p className="text-blue-400 uppercase">SENDER: {m.sender_name} ({m.sender_email})</p>
                      <p className="text-yellow-400 font-bold uppercase">SUBJ: {m.subject}</p>
                      <div className="mt-2 text-white text-[9px] bg-black/30 p-2 border border-gray-800 whitespace-pre-wrap">{m.content}</div>
                    </div>
                    <button onClick={() => deleteMessage(m.id)} className="nes-btn is-error text-[6px]">ERASE</button>
                  </div>
                </div>
              )) : <p className="text-[8px] text-gray-600 text-center py-4">INBOX_EMPTY</p>}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">BROADCAST_ARCHIVE</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {news.length > 0 ? news.map(n => (
                <div key={n.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-orange-400 font-bold uppercase truncate w-48">{n.title}</span>
                    <span className="text-[6px] text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => deleteNews(n.id)} className="nes-btn is-error text-[6px]">PURGE</button>
                </div>
              )) : <p className="text-[8px] text-gray-600 text-center py-4">NO_LOGS_FOUND</p>}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">PROJECT_INVENTORY</p>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {projects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[10px] text-yellow-400 font-bold uppercase">{p.title} <span className="text-gray-600">[{p.language}]</span></span>
                  <button onClick={() => deleteProject(p.id)} className="nes-btn is-error text-[6px]">ERASE</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: CREATION */}
        <div className="space-y-10">
          
          <section className="nes-container with-title is-dark">
            <p className="title">MODULE_ARCHITECT</p>
            <div className="space-y-4">
              <input placeholder="TITLE" className="nes-input is-dark text-xs" onChange={e => setTitle(e.target.value)} />
              
              <div className="nes-select is-dark">
                <select className="text-xs" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="python">PYTHON 3</option>
                  <option value="c">C (GCC)</option>
                  <option value="java">JAVA (JDK 17)</option>
                  <option value="nodejs">NODE.JS</option>
                  <option value="csharp">C#</option>
                  <option value="octave">OCTAVE</option>
                  <option value="racket">RACKET</option>
                  <option value="lua">LUA</option>
                  <option value="go">GO</option>
                </select>
              </div>

              <textarea placeholder="STARTER_CODE" className="nes-textarea is-dark h-40 text-[10px] font-mono" onChange={e => setBaseCode(e.target.value)} />
              <button onClick={saveProject} className="nes-btn is-success w-full text-[8px]">INITIALIZE_DEPLOYMENT</button>
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">NEW_BROADCAST</p>
            <div className="space-y-4">
              <input placeholder="BROADCAST_TITLE" className="nes-input is-dark text-xs" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
              <textarea placeholder="SIGNAL_CONTENT" className="nes-textarea is-dark h-24 text-[10px]" value={newsContent} onChange={e => setNewsContent(e.target.value)} />
              <button onClick={postNews} className="nes-btn is-warning w-full text-[8px]">TRANSMIT_SIGNAL</button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}