'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const ADMIN_EMAIL = 'kay31286@gmail.com'; 

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // --- DATA STATES ---
  const [news, setNews] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  
  // --- FORM STATES ---
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("python3");
  const [baseCode, setBaseCode] = useState("");
  const [description, setDescription] = useState("");
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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ADMIN_EMAIL) return alert("UNAUTHORIZED_EMAIL");
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/admin',
      },
    });

    if (error) {
      alert("TRANSMISSION_ERROR: " + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- TEST CASE LOGIC ---
  const addTestCase = () => {
    setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: string, value: string) => {
    const newTests = [...testCases];
    (newTests[index] as any)[field] = value;
    setTestCases(newTests);
  };

  const handleFileRead = (index: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newTests = [...testCases];
      newTests[index] = { ...newTests[index], file_name: file.name, file_content: content };
      setTestCases(newTests);
    };
    reader.readAsText(file);
  };

  // --- ACTION HANDLERS ---
  const saveProject = async () => {
    setLoading(true);
    const { data: pData, error: pErr } = await supabase.from('projects').insert([{ title, language, base_code: baseCode, description }]).select();
    if (pErr) { alert("DEPLOYMENT_FAILED"); setLoading(false); return; }

    const finalTests = testCases.map(tc => ({ ...tc, project_id: pData[0].id }));
    await supabase.from('test_cases').insert(finalTests);
    
    alert("MODULE_DEPLOYED");
    setLoading(false);
    refreshAll();
  };

  const postNews = async () => {
    await supabase.from('announcements').insert([{ title: newsTitle, content: newsContent }]);
    setNewsTitle(""); setNewsContent(""); refreshAll();
  };

  const deleteProject = async (id: string) => {
    if (confirm("ERASE_PROJECT?")) { await supabase.from('projects').delete().eq('id', id); refreshAll(); }
  };

  const deleteNews = async (id: string) => {
    if (confirm("PURGE_BROADCAST?")) { await supabase.from('announcements').delete().eq('id', id); refreshAll(); }
  };

  const deleteMessage = async (id: string) => {
    if (confirm("DELETE_MSG?")) { await supabase.from('messages').delete().eq('id', id); refreshAll(); }
  };

  if (loading) return <div className="p-20 text-white nes-text">INITIALIZING...</div>;

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-mono">
        <div className="nes-container with-title is-dark max-w-sm w-full">
          <p className="title text-[10px]">ADMIN_ACCESS</p>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-[10px] text-green-400">MAGIC_LINK_TRANSMITTED</p>
              <p className="text-[8px]">CHECK YOUR INBOX TO AUTHENTICATE.</p>
              <button onClick={() => setSent(false)} className="nes-btn is-warning text-[8px]">RETRY</button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="nes-field">
                <label className="text-[8px]">ADMIN_EMAIL</label>
                <input 
                  type="email" 
                  className="nes-input is-dark text-xs" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="nes-btn is-primary w-full text-[10px]">SEND_MAGIC_LINK</button>
              <div className="text-center mt-2">
                <Link href="/" className="text-[8px] text-gray-500 underline">RETURN_TO_BASE</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-10">
      <header className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
        <button onClick={handleLogout} className="nes-btn is-error text-[8px]">LOGOUT</button>
        <p className="nes-text is-primary text-[10px]">ROOT@KAYLAN_J:~$</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* --- LEFT: MANAGEMENT COLUMN --- */}
        <div className="space-y-10">
          
          <section className="nes-container with-title is-dark">
            <p className="title">SECURE_INBOX</p>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {inbox.map(m => (
                <div key={m.id} className="p-2 border-b border-gray-700 flex justify-between items-start">
                  <div className="text-[8px] space-y-1">
                    <p className="text-blue-400">{m.sender_name} ({m.sender_email})</p>
                    <p className="text-yellow-500 font-bold uppercase">{m.subject}</p>
                    <p className="text-gray-400">{m.content}</p>
                  </div>
                  <button onClick={() => deleteMessage(m.id)} className="nes-btn is-error text-[6px]">X</button>
                </div>
              ))}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">BROADCAST_ARCHIVE</p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {news.map(n => (
                <div key={n.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[8px] truncate w-48 uppercase">{n.title}</span>
                  <button onClick={() => deleteNews(n.id)} className="nes-btn is-error text-[6px]">PURGE</button>
                </div>
              ))}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">PROJECT_INVENTORY</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {projects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[8px] uppercase">{p.title}</span>
                  <button onClick={() => deleteProject(p.id)} className="nes-btn is-error text-[6px]">ERASE</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* --- RIGHT: CREATION COLUMN --- */}
        <div className="space-y-10">
          
          <section className="nes-container with-title is-dark">
            <p className="title">MODULE_ARCHITECT</p>
            <div className="space-y-4">
              <input placeholder="TITLE" className="nes-input is-dark text-xs" onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="DESCRIPTION" className="nes-textarea is-dark text-[8px] h-12" onChange={e => setDescription(e.target.value)} />
              
              <div className="nes-select is-dark">
                <select className="text-xs" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="python3">PYTHON 3</option>
                  <option value="cpp17">C++ (GCC)</option>
                  <option value="c">C (GCC)</option>
                  <option value="java">JAVA</option>
                  <option value="lua">LUA</option>
                  <option value="go">GO</option>
                </select>
              </div>

              <textarea placeholder="STARTER_CODE" className="nes-textarea is-dark h-32 text-[10px] font-mono" onChange={e => setBaseCode(e.target.value)} />

              {/* TEST CASES WITH FILE UPLOAD */}
              <div className="border-2 border-gray-700 p-4 space-y-4 bg-black/10">
                <p className="text-[8px] text-yellow-400 uppercase tracking-widest">Test_Cases</p>
                {testCases.map((tc, index) => (
                  <div key={index} className="p-3 border-l-2 border-yellow-600 bg-gray-800/20 space-y-3">
                    <div className="flex justify-between items-center">
                      <input placeholder="NAME" className="nes-input is-dark text-[8px] w-2/3" value={tc.name} onChange={e => updateTestCase(index, 'name', e.target.value)} />
                      <button type="button" onClick={() => removeTestCase(index)} className="nes-btn is-error text-[6px]">REMOVE</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <textarea placeholder="STDIN" className="nes-textarea is-dark text-[8px] h-10" value={tc.input} onChange={e => updateTestCase(index, 'input', e.target.value)} />
                      <textarea placeholder="EXPECT" className="nes-textarea is-dark text-[8px] h-10" value={tc.expected} onChange={e => updateTestCase(index, 'expected', e.target.value)} />
                    </div>
                    <div className="p-2 border border-gray-800">
                      <label className="text-[6px] text-blue-400 uppercase block mb-1">Upload_Test_File</label>
                      <input type="file" className="text-[6px]" onChange={e => handleFileRead(index, e.target.files?.[0])} />
                      {tc.file_name && <p className="text-[6px] text-green-500 mt-1 uppercase">Loaded: {tc.file_name}</p>}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTestCase} className="nes-btn is-primary text-[8px] w-full">+ ADD_TEST_CASE</button>
              </div>

              <button onClick={saveProject} className="nes-btn is-success w-full text-[10px]">DEPLOY_MODULE</button>
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">NEW_BROADCAST</p>
            <div className="space-y-4">
              <input placeholder="NEWS_TITLE" className="nes-input is-dark text-xs" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
              <textarea placeholder="CONTENT" className="nes-textarea is-dark h-20 text-[8px]" value={newsContent} onChange={e => setNewsContent(e.target.value)} />
              <button onClick={postNews} className="nes-btn is-warning w-full text-[8px]">TRANSMIT</button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}