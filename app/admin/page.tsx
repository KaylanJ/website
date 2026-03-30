'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Standardized import

export default function AdminDashboard() {
  const ADMIN_EMAIL = 'kay31286@gmail.com'; 

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- FIX 1: Added missing 'news' state ---
  const [news, setNews] = useState<any[]>([]);
  
  // Project Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [baseCode, setBaseCode] = useState("");
  const [testCases, setTestCases] = useState([{ name: "", input: "", expected: "", file_name: "", file_content: "" }]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);

  // News Form State
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === ADMIN_EMAIL) {
        setIsLoggedIn(true);
        fetchInventory();
        fetchNews(); // --- FIX 2: Fetch news on load ---
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setExistingProjects(data || []);
  };

  // --- FIX 3: Reusable News Fetcher ---
  const fetchNews = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setNews(data || []);
  };

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
    const { data: pData, error: pErr } = await supabase.from('projects').insert([{ title, description, language, base_code: baseCode }]).select();
    if (pErr) return alert("UPLOAD_FAILED");
    const finalTests = testCases.map(tc => ({ ...tc, project_id: pData[0].id }));
    await supabase.from('test_cases').insert(finalTests);
    alert("PROJECT_DEPLOYED");
    setLoading(false);
    fetchInventory();
  };

  const postNews = async () => {
    const { error } = await supabase.from('announcements').insert([{ title: newsTitle, content: newsContent }]);
    if (error) alert("NEWS_POST_FAILED");
    else { 
      alert("BROADCAST_SENT"); 
      setNewsTitle(""); 
      setNewsContent(""); 
      fetchNews(); // Refresh list after posting
    }
  };

  // --- FIX 4: Added missing deleteProject function ---
  const deleteProject = async (id: string) => {
    if (confirm("ERASE_MODULE: ARE_YOU_SURE?")) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) alert("ERASE_FAILED");
      else fetchInventory();
    }
  };

  const deleteNews = async (newsId: string) => {
    if (confirm("DELETE_BROADCAST: ARE_YOU_SURE?")) {
     const { error } = await supabase.from('announcements').delete().eq('id', newsId);
     if (error) alert("DELETE_FAILED");
     else fetchNews();
   }
  };

  if (loading) return <div className="p-20 text-white nes-text">BOOTING...</div>;
  if (!isLoggedIn) return <div className="p-20 text-white nes-text">ACCESS_DENIED</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-6">
      
      {/* 1. TOP NAVIGATION / BACK BUTTON */}
      <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
        <Link href="/" className="nes-btn is-error text-[8px]">
          &lt; EXIT_ADMIN_TERMINAL
        </Link>
        <p className="nes-text is-primary text-[10px]">ADMIN_LOGGED_IN: {ADMIN_EMAIL}</p>
      </div>

      {/* 2. MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* --- LEFT COLUMN: CREATION TOOLS --- */}
        <div className="space-y-10">
          
          {/* PROJECT CREATOR */}
          <section className="nes-container with-title is-dark">
            <p className="title">CREATE_MODULE</p>
            <div className="space-y-4">
              <input placeholder="PROJECT_TITLE" className="nes-input is-dark text-xs" onChange={e => setTitle(e.target.value)} />
              <div className="nes-select is-dark">
                <div className="nes-select is-dark">
                  <select className="text-xs" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="python">PYTHON 3</option>
                    <option value="c">C (GCC)</option>
                    <option value="java">JAVA (JDK 17)</option>
                    <option value="nodejs">JAVASCRIPT (NODE.JS)</option>
                    <option value="csharp">C# (.NET)</option>
                    <option value="octave">OCTAVE (MATLAB-ALT)</option>
                    <option value="racket">RACKET (LISP-STYLE)</option>
                    <option value="lua">LUA</option>
                    <option value="go">GO LANG</option>
                  </select>
                </div>
              </div>
              <textarea placeholder="STARTER_CODE_TEMPLATE" className="nes-textarea is-dark h-32 text-[10px] font-mono" onChange={e => setBaseCode(e.target.value)} />
              
              <p className="text-yellow-500 text-[10px] uppercase underline">Test Suite Setup</p>
              {testCases.map((tc, i) => (
                <div key={i} className="nes-container is-dark p-3 mb-4 space-y-2 border-dashed border-gray-600">
                  <input placeholder="TEST_NAME" className="nes-input is-dark text-[8px]" onChange={e => { let t = [...testCases]; t[i].name = e.target.value; setTestCases(t); }} />
                  <input placeholder="STDIN" className="nes-input is-dark text-[8px]" onChange={e => { let t = [...testCases]; t[i].input = e.target.value; setTestCases(t); }} />
                  <input placeholder="EXPECTED" className="nes-input is-dark text-[8px]" onChange={e => { let t = [...testCases]; t[i].expected = e.target.value; setTestCases(t); }} />
                  
                  <label className="nes-btn is-primary text-[8px] w-full block text-center">
                    <span>{tc.file_name || "ATTACH_FILE_INPUT"}</span>
                    <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileRead(i, e.target.files?.[0])} />
                  </label>
                </div>
              ))}
              
              <div className="flex gap-4">
                <button onClick={() => setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }])} className="nes-btn is-small text-[8px] flex-1">+ ADD_TEST</button>
                <button onClick={saveProject} className="nes-btn is-success text-[8px] flex-1">DEPLOY_MODULE</button>
              </div>
            </div>
          </section>

          {/* BROADCAST CENTER (POST NEWS) */}
          <section className="nes-container with-title is-dark">
            <p className="title">POST_BROADCAST</p>
            <div className="space-y-4">
              <input placeholder="BROADCAST_TITLE" className="nes-input is-dark text-xs" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
              <textarea placeholder="SYSTEM_MESSAGE_CONTENT" className="nes-textarea is-dark h-24 text-[10px]" value={newsContent} onChange={e => setNewsContent(e.target.value)} />
              <button onClick={postNews} className="nes-btn is-warning w-full text-[8px]">SEND_TO_HOME_TICKER</button>
            </div>
          </section>
        </div>

        {/* --- RIGHT COLUMN: MANAGEMENT --- */}
        <div className="space-y-10">
          
          {/* PROJECT INVENTORY */}
          <section className="nes-container with-title is-dark">
            <p className="title">PROJECT_INVENTORY</p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {existingProjects.length > 0 ? (
                existingProjects.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 border-b-2 border-gray-800 bg-gray-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-yellow-400 uppercase font-bold">{p.title}</span>
                      <span className="text-[7px] text-gray-500 uppercase">{p.language}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/view-project/${p.id}`} className="nes-btn is-primary text-[6px]">VIEW</Link>
                      <button onClick={() => deleteProject(p.id)} className="nes-btn is-error text-[6px]">ERASE</button>
                    </div>
                  </div>
                ))
              ) : <p className="text-[8px] text-gray-600 text-center py-4">NO_PROJECTS</p>}
            </div>
          </section>

          {/* NEWS MANAGEMENT */}
          <section className="nes-container with-title is-dark">
            <p className="title">NEWS_ARCHIVE</p>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {news.length > 0 ? (
                news.map((n) => (
                  <div key={n.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                    <div className="flex flex-col max-w-[70%]">
                      <span className="text-[8px] text-orange-400 truncate font-bold">{n.title}</span>
                      <span className="text-[6px] text-gray-500">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => deleteNews(n.id)} className="nes-btn is-error text-[6px]">DELETE</button>
                  </div>
                ))
              ) : <p className="text-[8px] text-gray-600 text-center py-4">NO_BROADCASTS</p>}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}