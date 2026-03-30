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

  // --- TEST CASE LOGIC ---
  const addTestCase = () => {
    setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }]);
  };

  const removeTestCase = (index: number) => {
    const newTests = testCases.filter((_, i) => i !== index);
    setTestCases(newTests);
  };

  const updateTestCase = (index: number, field: string, value: string) => {
    const newTests = [...testCases];
    (newTests[index] as any)[field] = value;
    setTestCases(newTests);
  };

  // --- RESTORED FILE LOGIC ---
  const handleFileRead = (index: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newTests = [...testCases];
      newTests[index] = { 
        ...newTests[index], 
        file_name: file.name, 
        file_content: content 
      };
      setTestCases(newTests);
    };
    reader.readAsText(file);
  };

  const removeFileFromTestCase = (index: number) => {
    const newTests = [...testCases];
    newTests[index].file_name = "";
    newTests[index].file_content = "";
    setTestCases(newTests);
  };

  const saveProject = async () => {
    setLoading(true);
    const { data: pData, error: pErr } = await supabase.from('projects').insert([
      { title, language, base_code: baseCode, description }
    ]).select();

    if (pErr) {
      alert("DEPLOYMENT_FAILED");
      setLoading(false);
      return;
    }

    const finalTests = testCases.map(tc => ({ ...tc, project_id: pData[0].id }));
    await supabase.from('test_cases').insert(finalTests);
    
    alert("MODULE_DEPLOYED");
    setLoading(false);
    refreshAll();
  };

  // --- OMITTED: postNews, deleteProject, deleteNews, deleteMessage (Same as previous) ---
  const postNews = async () => {
    await supabase.from('announcements').insert([{ title: newsTitle, content: newsContent }]);
    setNewsTitle(""); setNewsContent(""); refreshAll();
  };
  const deleteProject = async (id: string) => {
    if (confirm("ERASE?")) { await supabase.from('projects').delete().eq('id', id); refreshAll(); }
  };
  const deleteNews = async (id: string) => {
    if (confirm("PURGE?")) { await supabase.from('announcements').delete().eq('id', id); refreshAll(); }
  };
  const deleteMessage = async (id: string) => {
    if (confirm("DELETE?")) { await supabase.from('messages').delete().eq('id', id); refreshAll(); }
  };

  if (loading) return <div className="p-20 text-white nes-text">BOOTING...</div>;
  if (!isLoggedIn) return <div className="p-20 text-white nes-text">UNAUTHORIZED</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono space-y-10">
      <header className="flex justify-between items-center border-b-2 border-gray-800 pb-4">
        <Link href="/" className="nes-btn is-error text-[8px]">LOGOUT</Link>
        <p className="nes-text is-primary text-[10px]">ROOT@KAYLAN_J:~$</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* MANAGEMENT SIDE */}
        <div className="space-y-10">
          <section className="nes-container with-title is-dark">
            <p className="title">INBOX</p>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {inbox.map(m => (
                <div key={m.id} className="p-2 border-b border-gray-800 flex justify-between items-center">
                  <div className="text-[8px]">
                    <p className="text-blue-400">{m.sender_name}</p>
                    <p className="text-yellow-500 uppercase">{m.subject}</p>
                  </div>
                  <button onClick={() => deleteMessage(m.id)} className="nes-btn is-error text-[6px]">X</button>
                </div>
              ))}
            </div>
          </section>

          <section className="nes-container with-title is-dark">
            <p className="title">PROJECTS</p>
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

        {/* CREATION SIDE */}
        <div className="space-y-10">
          <section className="nes-container with-title is-dark">
            <p className="title">MODULE_ARCHITECT</p>
            <div className="space-y-4">
              <input placeholder="TITLE" className="nes-input is-dark text-xs" onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="DESC" className="nes-textarea is-dark text-[8px] h-12" onChange={e => setDescription(e.target.value)} />
              
              <div className="nes-select is-dark">
                <select className="text-xs" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="python3">PYTHON 3</option>
                  <option value="cpp17">C++ (GCC)</option>
                  <option value="c">C (GCC)</option>
                  <option value="java">JAVA</option>
                  <option value="lua">LUA</option>
                </select>
              </div>

              <textarea placeholder="CODE" className="nes-textarea is-dark h-32 text-[10px] font-mono" onChange={e => setBaseCode(e.target.value)} />

              {/* TEST CASES */}
              <div className="border-2 border-gray-700 p-4 space-y-6 bg-black/20">
                <p className="text-[8px] text-yellow-400 underline uppercase">Test_Cases</p>
                {testCases.map((tc, index) => (
                  <div key={index} className="p-3 border-l-2 border-gray-700 space-y-3 relative bg-gray-800/20">
                    <div className="flex justify-between items-center">
                      <input placeholder="CASE_NAME" className="nes-input is-dark text-[8px] w-2/3" 
                        value={tc.name} onChange={e => updateTestCase(index, 'name', e.target.value)} />
                      <button type="button" onClick={() => removeTestCase(index)} className="nes-btn is-error text-[6px]">REMOVE_CASE</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <textarea placeholder="STDIN" className="nes-textarea is-dark text-[8px] h-10" 
                        value={tc.input} onChange={e => updateTestCase(index, 'input', e.target.value)} />
                      <textarea placeholder="EXPECTED" className="nes-textarea is-dark text-[8px] h-10" 
                        value={tc.expected} onChange={e => updateTestCase(index, 'expected', e.target.value)} />
                    </div>

                    <div className="p-2 border border-gray-800 rounded">
                      <label className="text-[6px] block mb-1 text-blue-400">FILE_ATTACHMENT</label>
                      {!tc.file_name ? (
                        <input type="file" className="text-[6px]" onChange={e => handleFileRead(index, e.target.files?.[0])} />
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-[6px] text-green-500">FILE: {tc.file_name}</span>
                          <button type="button" onClick={() => removeFileFromTestCase(index)} className="nes-text is-error text-[6px] underline">CANCEL</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addTestCase} className="nes-btn is-primary text-[8px] w-full">+ ADD_NEW_CASE</button>
              </div>

              <button onClick={saveProject} className="nes-btn is-success w-full text-[10px]">DEPLOY_PROJECT</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}