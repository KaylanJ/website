'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const ADMIN_EMAIL = 'kay31286@gmail.com'; // <--- CHANGE THIS

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [baseCode, setBaseCode] = useState("");
  const [testCases, setTestCases] = useState([{ name: "", input: "", expected: "", file_name: "", file_content: "" }]);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === ADMIN_EMAIL) {
        setIsLoggedIn(true);
        fetchInventory();
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ 
      email: emailInput,
      options: { emailRedirectTo: window.location.origin + '/admin' }
    });
    if (error) alert(error.message);
    else alert("CHECK_EMAIL: MAGIC_LINK_SENT");
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    setExistingProjects(data || []);
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
    const { data: pData, error: pErr } = await supabase
      .from('projects')
      .insert([{ title, description, language, base_code: baseCode }])
      .select();

    if (pErr) return alert("UPLOAD_FAILED: " + pErr.message);

    const projectId = pData[0].id;
    const finalTests = testCases.map(tc => ({
      project_id: projectId,
      name: tc.name,
      input: tc.input,
      expected_output: tc.expected,
      file_name: tc.file_name,
      file_content: tc.file_content
    }));

    await supabase.from('test_cases').insert(finalTests);
    alert("SYSTEM_UPDATED: PROJECT_LIVE");
    setLoading(false);
    fetchInventory();
  };

  if (loading) return <div className="p-20 text-white nes-text">BOOTING...</div>;

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-10 font-mono">
        <section className="nes-container with-title is-dark">
          <p className="title">RESTRICTED_ACCESS</p>
          <input className="nes-input is-dark mb-4" placeholder="admin@email.com" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
          <button onClick={handleLogin} className="nes-btn is-primary w-full">LOGIN</button>
        </section>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-white font-mono">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <section className="nes-container with-title is-dark">
          <p className="title">CREATE_MODULE</p>
          <div className="space-y-4">
            <input placeholder="TITLE" className="nes-input is-dark text-xs" onChange={e => setTitle(e.target.value)} />
            <div className="nes-select is-dark">
              <select onChange={e => setLanguage(e.target.value)}>
                <option value="python">PYTHON</option>
                <option value="c">C</option>
                <option value="java">JAVA</option>
              </select>
            </div>
            <textarea placeholder="STARTER_CODE" className="nes-textarea is-dark font-mono text-xs h-32" onChange={e => setBaseCode(e.target.value)} />
            
            <p className="text-yellow-500 text-xs">TEST_CASES + FILES</p>
            {testCases.map((tc, i) => (
              <div key={i} className="nes-container is-dark p-2 text-[10px] space-y-2">
                <input placeholder="TEST_NAME" className="nes-input is-dark" onChange={e => { let t = [...testCases]; t[i].name = e.target.value; setTestCases(t); }} />
                <input placeholder="STDIN_INPUT" className="nes-input is-dark" onChange={e => { let t = [...testCases]; t[i].input = e.target.value; setTestCases(t); }} />
                <input placeholder="EXPECTED" className="nes-input is-dark" onChange={e => { let t = [...testCases]; t[i].expected = e.target.value; setTestCases(t); }} />
                
                <label className="nes-btn is-primary text-[8px] block">
                  <span>{tc.file_name || "ATTACH_FILE"}</span>
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileRead(i, e.target.files?.[0])} />
                </label>
              </div>
            ))}
            <button onClick={() => setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }])} className="nes-btn is-small text-[8px]">+ ADD_TEST</button>
            <button onClick={saveProject} className="nes-btn is-success w-full mt-4">DEPLOY</button>
          </div>
        </section>

        <section className="nes-container with-title is-dark">
          <p className="title">INVENTORY</p>
          {existingProjects.map(p => (
            <div key={p.id} className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
              <span className="text-[10px] uppercase">{p.title} ({p.language})</span>
              <button onClick={async () => { await supabase.from('projects').delete().eq('id', p.id); fetchInventory(); }} className="nes-btn is-error text-[8px]">ERASE</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}