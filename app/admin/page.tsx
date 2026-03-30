'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const ADMIN_EMAIL = 'kay31286@gmail.com'; 

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [news, setNews] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  
  // --- FORM STATES ---
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("python3");
  const [baseCode, setBaseCode] = useState("");
  const [description, setDescription] = useState("");
  // Test Cases State
  const [testCases, setTestCases] = useState([{ name: "Default", input: "", expected: "", file_name: "", file_content: "" }]);
  
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

  // --- TEST CASE LOGIC ---
  const addTestCase = () => {
    setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }]);
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
      newTests[index].file_name = file.name;
      newTests[index].file_content = content;
      setTestCases(newTests);
    };
    reader.readAsText(file);
  };

  // --- SAVE LOGIC ---
  const saveProject = async () => {
    setLoading(true);
    const { data: pData, error: pErr } = await supabase.from('projects').insert([
      { title, language, base_code: baseCode, description }
    ]).select();

    if (pErr) {
      alert("DEPLOYMENT_FAILED: " + pErr.message);
      setLoading(false);
      return;
    }

    const finalTests = testCases.map(tc => ({ ...tc, project_id: pData[0].id }));
    const { error: tErr } = await supabase.from('test_cases').insert(finalTests);
    
    if (tErr) alert("TEST_CASE_UPLOAD_FAILED");
    else alert("MODULE_DEPLOYED_WITH_TEST_CASES");

    setLoading(false);
    refreshAll();
  };

  const postNews = async () => {
    await supabase.from('announcements').insert([{ title: newsTitle, content: newsContent }]);
    setNewsTitle(""); setNewsContent(""); refreshAll();
  };

  // --- DELETE LOGIC ---
  const deleteProject = async (id: string) => {
    if (confirm("ERASE_PROJECT?")) { await supabase.from('projects').delete().eq('id', id); refreshAll(); }
  };
  const deleteNews = async (id: string) => {
    if (confirm("PURGE_NEWS?")) { await supabase.from('announcements').delete().eq('id', id); refreshAll(); }
  };
  const deleteMessage = async (id: string) => {
    if (confirm("DELETE_MSG?")) { await supabase.from('messages').delete().eq('id', id); refreshAll(); }
  };

  if (loading) return <div className="p-20 text-white nes-text">LOADING_ADMIN_CORE...</div>;
  if (!isLoggedIn) return <div className="p-20 text-white nes-text">ACCESS_DENIED</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-10">
      <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
        <Link href="/" className="nes-btn is-error text-[8px]">LOGOUT</Link>
        <p className="nes-text is-primary text-[10px]">ROOT@KAYLAN_J:~$</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* LEFT: MANAGEMENT */}
        <div className="space-y-10">
          <section className="nes-container with-title is-dark">
            <p className="title">INBOX</p>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {inbox.map(m => (
                <div key={m.id} className="p-2 border-b border-gray-700 flex justify-between items-start">
                  <div className="text-[8px]">
                    <p className="text-blue-400">{m.sender_name} ({m.sender_email})</p>
                    <p className="text-yellow-500">{m.subject}</p>
                    <p className="mt-1 text-gray-300">{m.content}</p>
                  </div>
                  <button onClick={() => deleteMessage(m.id)} className="nes-btn is-error text-[6px]">X</button>
                </div>
              ))}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">ANNOUNCEMENTS</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {news.map(n => (
                <div key={n.id} className="flex justify-between items-center p-2 border-b border-gray-800">
                  <span className="text-[8px] truncate w-40">{n.title}</span>
                  <button onClick={() => deleteNews(n.id)} className="nes-btn is-error text-[6px]">DELETE</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT: CREATION (WITH TEST CASES) */}
        <div className="space-y-10">
          <section className="nes-container with-title is-dark">
            <p className="title">MODULE_ARCHITECT</p>
            <div className="space-y-4">
              <input placeholder="PROJECT_TITLE" className="nes-input is-dark text-xs" onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="DESCRIPTION" className="nes-textarea is-dark text-[8px] h-16" onChange={e => setDescription(e.target.value)} />
              
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

              {/* TEST CASE SUB-SECTION */}
              <div className="border-2 border-dashed border-gray-700 p-4 space-y-4">
                <p className="text-[8px] text-yellow-400 uppercase">Test_Configuration</p>
                {testCases.map((tc, index) => (
                  <div key={index} className="space-y-2 pb-4 border-b border-gray-800">
                    <input placeholder="CASE_NAME (e.g. Test 1)" className="nes-input is-dark text-[8px]" 
                      value={tc.name} onChange={e => updateTestCase(index, 'name', e.target.value)} />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <textarea placeholder="STDIN_INPUT" className="nes-textarea is-dark text-[8px] h-12" 
                        value={tc.input} onChange={e => updateTestCase(index, 'input', e.target.value)} />
                      <textarea placeholder="EXPECTED_STDOUT" className="nes-textarea is-dark text-[8px] h-12" 
                        value={tc.expected} onChange={e => updateTestCase(index, 'expected', e.target.value)} />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[6px] text-blue-400 uppercase">Attach_File_Module (Optional)</label>
                      <input type="file" className="text-[6px]" onChange={e => handleFileRead(index, e.target.files?.[0])} />
                      {tc.file_name && <p className="text-[6px] text-green-500">LOADED: {tc.file_name}</p>}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTestCase} className="nes-btn is-primary text-[8px] w-full">+ ADD_TEST_CASE</button>
              </div>

              <button onClick={saveProject} className="nes-btn is-success w-full text-[10px]">INITIALIZE_DEPLOYMENT</button>
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