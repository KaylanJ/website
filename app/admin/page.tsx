'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [lastProjectId, setLastProjectId] = useState("");
  
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsLoggedIn(true);
        refreshAll();
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsLoggedIn(true);
        if (!isLoggedIn) refreshAll(); 
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isLoggedIn]);

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
      options: { emailRedirectTo: window.location.origin + '/admin' },
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

  // --- INDEPENDENT TEST CASE FUNCTIONS ---
  const saveTestCases = async () => {
    if (!lastProjectId.trim()) {
      alert("DEPLOY_PROJECT_FIRST");
      return;
    }

    const validTests = testCases
      .filter(tc => tc.name.trim() !== "" && tc.expected.trim() !== "")
      .map(tc => ({ 
        project_id: lastProjectId,
        name: tc.name,
        input: tc.input || null,
        expected_output: tc.expected,
        description: null,
        file_name: tc.file_name || null,
        file_content: tc.file_content || null
      }));

    if (validTests.length === 0) {
      alert("NO_VALID_TEST_CASES_TO_SAVE");
      return;
    }

    setLoading(true);
    const { error: tErr } = await supabase.from('test_cases').insert(validTests);
    
    if (tErr) {
      alert("FAILED_TO_SAVE: " + tErr.message);
      console.error("Test save error:", tErr);
    } else {
      alert(`SAVED_${validTests.length}_TEST_CASES`);
      setTestCases([{ name: "", input: "", expected: "", file_name: "", file_content: "" }]);
      setLastProjectId("");
    }
    setLoading(false);
  };

  // --- ACTION HANDLERS ---
  const getValidTestCases = () => {
    return testCases.filter(tc => tc.name.trim() !== "" && tc.expected.trim() !== "");
  };

  const saveProject = async () => {
    if (!title.trim()) return alert("PROJECT_TITLE_REQUIRED");
    
    setLoading(true);
    const { data: pData, error: pErr } = await supabase
      .from('projects')
      .insert([{ title, language, base_code: baseCode, description }])
      .select();

    if (pErr) { 
      alert("DEPLOYMENT_FAILED: " + pErr.message); 
      setLoading(false); 
      return; 
    }

    alert("PROJECT_DEPLOYED");
    setLastProjectId(pData[0].id);
    
    setTitle("");
    setDescription("");
    setBaseCode("");
    setLanguage("python3");
    setLoading(false);
    refreshAll();
  };

  const postNews = async () => {
    if (!newsTitle || !newsContent) return alert("EMPTY_FIELDS");
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
              <button onClick={() => setSent(false)} className="nes-btn is-warning text-[8px]">RETRY</button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="nes-field">
                <label className="text-[8px]">ADMIN_EMAIL</label>
                <input type="email" className="nes-input is-dark text-xs" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="nes-btn is-primary w-full text-[10px]">SEND_MAGIC_LINK</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-900 min-h-screen text-white font-mono space-y-6">
      <header className="flex justify-between items-center border-b-2 border-gray-800 pb-2">
        <button onClick={handleLogout} className="nes-btn is-error text-[9px]">LOGOUT</button>
        <p className="nes-text is-primary text-[10px]">ROOT@KAYLAN_J:~$</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* --- LEFT: BROADCAST & INBOX --- */}
        <div className="space-y-4">
          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">BROADCAST_CONTROL</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {news.length === 0 && <p className="text-[8px] text-gray-500">NO_ACTIVE_BROADCASTS</p>}
              {news.map(n => (
                <div key={n.id} className="p-2 border-b border-gray-700 bg-black/20 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-yellow-400 text-[8px]">{n.title}</p>
                    <p className="text-[7px] text-gray-400 line-clamp-1">{n.content}</p>
                  </div>
                  <button onClick={() => deleteNews(n.id)} className="nes-btn is-error text-[6px] p-0.5">DEL</button>
                </div>
              ))}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">SECURE_INBOX</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {inbox.map(m => (
                <div key={m.id} className="p-2 border-b border-gray-700 flex justify-between gap-2">
                  <div className="text-[7px] space-y-0.5 min-w-0">
                    <p className="text-blue-400">{m.sender_name}</p>
                    <p className="text-yellow-500 truncate">{m.subject}</p>
                    <p className="text-gray-400 line-clamp-1 text-[6px]">{m.content}</p>
                  </div>
                  <button onClick={() => deleteMessage(m.id)} className="nes-btn is-error text-[6px] p-0.5 flex-shrink-0">X</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* --- MIDDLE: PROJECT INVENTORY --- */}
        <div className="space-y-4">
          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">PROJECT_INVENTORY</p>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {projects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[7px] uppercase truncate">{p.title} ({p.language})</span>
                  <button onClick={() => deleteProject(p.id)} className="nes-btn is-error text-[6px] p-0.5 flex-shrink-0">ERASE</button>
                </div>
              ))}
            </div>
          </section>
          
          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">NEW_BROADCAST</p>
            <div className="space-y-2">
              <input placeholder="TITLE" className="nes-input is-dark text-[8px]" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
              <textarea placeholder="MESSAGE" className="nes-textarea is-dark h-16 text-[7px]" value={newsContent} onChange={e => setNewsContent(e.target.value)} />
              <button onClick={postNews} className="nes-btn is-warning w-full text-[8px]">TRANSMIT</button>
            </div>
          </section>
        </div>

        {/* --- RIGHT: MODULE ARCHITECT --- */}
        <div className="space-y-4">
          <section className="nes-container with-title is-dark">
            <p className="title text-[8px]">MODULE_ARCHITECT</p>
            <div className="space-y-2 max-h-screen overflow-y-auto">
              <input placeholder="TITLE" className="nes-input is-dark text-[8px]" onChange={e => setTitle(e.target.value)} />
              
              <textarea placeholder="DESCRIPTION" className="nes-textarea is-dark h-12 text-[7px]" onChange={e => setDescription(e.target.value)} />
              
              <div className="nes-select is-dark">
                <select className="text-[8px]" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="python3">PYTHON 3</option>
                  <option value="cpp17">C++ 17 (GCC)</option>
                  <option value="c">C (GCC)</option>
                  <option value="java">JAVA 17</option>
                  <option value="nodejs">NODE.JS</option>
                  <option value="csharp">C# (MONO)</option>
                  <option value="go">GO</option>
                  <option value="lua">LUA</option>
                </select>
              </div>

              <textarea placeholder="STARTER_CODE" className="nes-textarea is-dark h-24 text-[7px] font-mono" onChange={e => setBaseCode(e.target.value)} />

              <div className="border-2 border-gray-700 p-2 space-y-2 bg-black/10">
                <div className="flex justify-between items-center">
                  <p className="text-[7px] text-yellow-400">TEST_CASES: {getValidTestCases().length} VALID</p>
                </div>
                {testCases.map((tc, index) => (
                  <div key={index} className="p-2 border-l-2 border-yellow-600 bg-gray-800/20 space-y-1">
                    <input placeholder="NAME" className="nes-input is-dark text-[7px]" value={tc.name} onChange={e => updateTestCase(index, 'name', e.target.value)} />
                    <textarea placeholder="INPUT" className="nes-textarea is-dark text-[7px] h-8" value={tc.input} onChange={e => updateTestCase(index, 'input', e.target.value)} />
                    <textarea placeholder="EXPECTED" className="nes-textarea is-dark text-[7px] h-8" value={tc.expected} onChange={e => updateTestCase(index, 'expected', e.target.value)} />
                    
                    <div className="p-1 border border-gray-800">
                      <label className="text-[6px] text-blue-400 block mb-0.5">FILE</label>
                      <input type="file" className="text-[6px]" onChange={e => handleFileRead(index, e.target.files?.[0])} />
                      {tc.file_name && <p className="text-[6px] text-green-500 mt-0.5">✓ {tc.file_name}</p>}
                    </div>
                    <button type="button" onClick={() => removeTestCase(index)} className="nes-btn is-error text-[6px] p-0.5 w-full">REMOVE</button>
                  </div>
                ))}
                <button type="button" onClick={addTestCase} className="nes-btn is-primary text-[7px] w-full">+ ADD</button>
              </div>

              <div className="flex gap-2">
                <button onClick={saveProject} className="nes-btn is-success flex-1 text-[8px]">DEPLOY</button>
                <button onClick={saveTestCases} disabled={!lastProjectId} className={`nes-btn flex-1 text-[8px] ${lastProjectId ? "is-warning" : "is-disabled"}`}>SAVE_TESTS</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}