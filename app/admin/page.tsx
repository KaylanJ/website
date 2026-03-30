'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const ADMIN_EMAIL = 'kay31286@gmail.com'; // <--- CHANGE THIS

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    };
    checkUser();
  }, []);

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
    else { alert("BROADCAST_SENT"); setNewsTitle(""); setNewsContent(""); }
  };

  if (loading) return <div className="p-20 text-white nes-text">BOOTING...</div>;
  if (!isLoggedIn) return <div className="p-20 text-white nes-text">ACCESS_DENIED</div>;

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-white font-mono space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <section className="nes-container with-title is-dark">
          <p className="title">CREATE_MODULE</p>
          <div className="space-y-4">
            <input placeholder="TITLE" className="nes-input is-dark" onChange={e => setTitle(e.target.value)} />
            <select className="nes-select is-dark w-full bg-gray-800 p-2" onChange={e => setLanguage(e.target.value)}>
              <option value="python">PYTHON</option>
              <option value="c">C</option>
              <option value="java">JAVA</option>
            </select>
            <textarea placeholder="STARTER_CODE" className="nes-textarea is-dark h-32 text-xs" onChange={e => setBaseCode(e.target.value)} />
            
            <p className="text-yellow-500 text-xs">TEST_SUITE</p>
            {testCases.map((tc, i) => (
              <div key={i} className="nes-container is-dark p-2 text-[10px] space-y-2">
                <input placeholder="TEST_NAME" className="nes-input is-dark" onChange={e => { let t = [...testCases]; t[i].name = e.target.value; setTestCases(t); }} />
                <input placeholder="STDIN (CMD_LINE_INPUT)" className="nes-input is-dark" onChange={e => { let t = [...testCases]; t[i].input = e.target.value; setTestCases(t); }} />
                <input placeholder="EXPECTED_OUTPUT" className="nes-input is-dark" onChange={e => { let t = [...testCases]; t[i].expected = e.target.value; setTestCases(t); }} />
                <label className="nes-btn is-primary text-[8px] block">
                  <span>{tc.file_name || "ATTACH_FILE_INPUT"}</span>
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileRead(i, e.target.files?.[0])} />
                </label>
              </div>
            ))}
            <button onClick={() => setTestCases([...testCases, { name: "", input: "", expected: "", file_name: "", file_content: "" }])} className="nes-btn is-small">+ ADD_TEST</button>
            <button onClick={saveProject} className="nes-btn is-success w-full mt-4">DEPLOY_PROJECT</button>
          </div>
        </section>

        <section className="nes-container with-title is-dark">
          <p className="title">BROADCAST_CENTER</p>
          <div className="space-y-4">
            <input placeholder="NEWS_TITLE" className="nes-input is-dark" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
            <textarea placeholder="MESSAGE_CONTENT" className="nes-textarea is-dark h-24 text-xs" value={newsContent} onChange={e => setNewsContent(e.target.value)} />
            <button onClick={postNews} className="nes-btn is-warning w-full">SEND_BROADCAST</button>
          </div>
        </section>
      </div>
    </div>
  );
}