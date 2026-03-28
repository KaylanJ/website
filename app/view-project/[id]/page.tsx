'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProjectLab() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [userCode, setUserCode] = useState("");
  const [terminal, setTerminal] = useState("READY.");
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    async function getProject() {
      const { data } = await supabase.from('projects').select('*, test_cases(*)').eq('id', id).single();
      if (data) { setProject(data); setUserCode(data.base_code || ""); }
    }
    if (id) getProject();
  }, [id]);

  const runAllTests = async () => {
    setTerminal("RUNNING_TESTS...\n");
    const results = [];
    for (const test of project.test_cases) {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: userCode,
          language: project.language,
          stdin: test.input,
          file_name: test.file_name,
          file_content: test.file_content
        }),
      });
      const data = await res.json();
      const passed = data.output?.trim() === test.expected_output?.trim();
      results.push({ name: test.name, passed });
    }
    setTestResults(results);
    setTerminal("COMPLETE.");
  };

  if (!project) return <div className="p-20 text-white nes-text">LOADING...</div>;

  return (
    <div className="p-10 bg-gray-900 min-h-screen text-white font-mono">
      <h2 className="nes-text is-success mb-6 underline uppercase">{project.title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nes-container with-title is-dark">
          <p className="title">EDITOR</p>
          <textarea className="w-full h-64 bg-black text-green-400 p-3 text-sm outline-none font-mono" value={userCode} onChange={(e) => setUserCode(e.target.value)} />
          <button onClick={runAllTests} className="nes-btn is-warning w-full mt-4">RUN_ALL_TESTS</button>
        </div>
        <div className="space-y-4">
          <div className="nes-container with-title is-dark h-32 overflow-hidden">
            <p className="title">TERMINAL</p>
            <pre className="text-[10px] text-green-500">{terminal}</pre>
          </div>
          <div className="nes-container with-title is-dark h-40 overflow-y-auto">
            <p className="title">RESULTS</p>
            {testResults.map((r, i) => (
              <p key={i} className={`text-[10px] ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                {r.passed ? '[PASS]' : '[FAIL]'} {r.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}