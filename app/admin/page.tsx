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

  // --- HANDLERS ---
  const handleFileRead = (index: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newTests = [...testCases];
      newTests[index].file_name = file.name;
      newTests[index].file_content = content;
      setTestCases(newTests);
    };
    reader.readAsText(file);
  };

  const saveProject = async () => {
    setLoading(true);
    const { data: pData, error: pErr } = await supabase.from('projects').insert([{ title, language, base_code: baseCode }]).select();
    if (pErr) return alert("DEPLOYMENT_FAILED");
    const finalTests = testCases.map(tc => ({ ...tc, project_id: pData[0].id }));
    await supabase.from('test_cases').insert(finalTests);
    alert("MODULE_DEPLOYED");
    setLoading(false);
    refreshAll();
  };

  const postNews = async () => {
    const { error } = await supabase.from('announcements').insert([{ title: newsTitle, content: newsContent }]);
    if (error) alert("BROADCAST_FAILED");
    else { alert("BROADCAST_LIVE"); setNewsTitle(""); setNewsContent(""); refreshAll(); }
  };

  // --- DELETE ACTIONS (WITH REFRESH FIX) ---
  const deleteProject = async (id: string) => {
    if (confirm("ERASE_PROJECT_DATA?")) {
      await supabase.from('projects').delete().eq('id', id);
      refreshAll();
    }
  };

  const deleteNews = async (id: string) => {
    if (confirm("PURGE_BROADCAST?")) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) alert("PURGE_FAILED: " + error.message);
      else refreshAll();
    }
  };

  const deleteMessage = async (id: string) => {
    if (confirm("DELETE_MESSAGE?")) {
      await supabase.from('messages').delete().eq('id', id);
      refreshAll();
    }
  };

  if (loading) return <div className="p-20 text-white nes-text">BOOTING_CORE...</div>;
  if (!isLoggedIn) return <div className="p-20 text-white nes-text">UNAUTHORIZED_ACCESS</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
        <Link href="/" className="nes-btn is-error text-[8px]">&lt; DISCONNECT</Link>
        <p className="nes-text is-primary text-[10px]">ROOT@PORTFOLIO_V3:~$</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: CREATION */}
        <div className="space-y-8">
          <section className="nes-container with-title is-dark">
            <p className="title">PROJECT_ARCHITECT</p>
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
              <textarea placeholder="BASE_CODE" className="nes-textarea is-dark h-32 text-[10px] font-mono" onChange={e => setBaseCode(e.target.value)} />
              {testCases.map((tc, i) => (
                <div key={i} className="nes-container is-dark p-2 border-dashed">
                  <input placeholder="TEST_NAME" className="nes-input is-dark text-[8px] mb-2" onChange={e => { let t = [...testCases]; t[i].name = e.target.value; setTestCases(t); }} />
                  <input placeholder="INPUT" className="nes-input is-dark text-[8px] mb-2" onChange={e => { let t = [...testCases]; t[i].input = e.target.value; setTestCases(t); }} />
                  <input placeholder="EXPECTED" className="nes-input is-dark text-[8px] mb-2" onChange={e => { let t = [...testCases]; t[i].expected = e.target.value; setTestCases(t); }} />
                  <label className="nes-btn is-primary text-[8px] w-full block text-center">
                    <span>{tc.file_name || "ATTACH_FILE"}</span>
                    <input type="file" className="hidden" onChange={(e) => handleFileRead(i, e.target.files?.[0])} />
                  </label>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }])} className="nes-btn is-small text-[8px] flex-1">+ TEST</button>
                <button onClick={saveProject} className="nes-btn is-success text-[8px] flex-1">DEPLOY</button>
              </div>
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">POST_BROADCAST</p>
            <div className="space-y-4">
              <input placeholder="TITLE" className="nes-input is-dark text-xs" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
              <textarea placeholder="MESSAGE" className="nes-textarea is-dark h-24 text-[10px]" value={newsContent} onChange={e => setNewsContent(e.target.value)} />
              <button onClick={postNews} className="nes-btn is-warning w-full text-[8px]">SEND_SIGNAL</button>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: MANAGEMENT */}
        <div className="space-y-8">
          <section className="nes-container with-title is-dark">
            <p className="title">SECURE_INBOX</p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {inbox.length > 0 ? inbox.map(m => (
                <div key={m.id} className="p-2 border-b border-gray-800 bg-gray-800/30">
                  <div className="flex justify-between items-start">
                    <div className="text-[8px]">
                      <p className="text-blue-400">FROM: {m.sender_name} ({m.sender_email})</p>
                      <p className="text-yellow-500 font-bold">SUBJ: {m.subject}</p>
                      <p className="mt-1 text-white">{m.content}</p>
                    </div>
                    <button onClick={() => deleteMessage(m.id)} className="nes-btn is-error text-[6px]">X</button>
                  </div>
                </div>
              )) : <p className="text-[8px] text-gray-600 text-center py-4">NO_INCOMING_MESSAGES</p>}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">PROJECT_INVENTORY</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[10px] text-yellow-400 font-bold">{p.title} <span className="text-gray-600">[{p.language}]</span></span>
                  <div className="flex gap-2">
                    <Link href={`/view-project/${p.id}`} className="nes-btn is-primary text-[6px]">VIEW</Link>
                    <button onClick={() => deleteProject(p.id)} className="nes-btn is-error text-[6px]">ERASE</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">NEWS_ARCHIVE</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {news.map(n => (
                <div key={n.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[8px] text-orange-400 truncate w-40">{n.title}</span>
                  <button onClick={() => deleteNews(n.id)} className="nes-btn is-error text-[6px]">DELETE</button>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}