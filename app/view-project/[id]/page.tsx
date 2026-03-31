'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/dist/client/link';

export default function ProjectLab() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [userCode, setUserCode] = useState("");
  const [terminal, setTerminal] = useState("READY.");
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    async function getProject() {
      const { data } = await supabase.from('projects').select('*, test_cases(*)').eq('id', id).single();
      if (data) { setProject(data); setUserCode(data.base_code || ""); }
    }
    if (id) getProject();
  }, [id]);

  const runCode = async (test?: any) => {
    setTerminal(`[INITIALIZING] LANGUAGE: ${project.language.toUpperCase()}...\n`);
    
    const res = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script: userCode,
        language: project.language,
        stdin: test?.input || "",
        file_name: test?.file_name || "",
        file_content: test?.file_content || ""
      }),
    });

    const data = await res.json();
    
    // Handling the response
    if (data.output) {
      if (test) {
        const passed = data.output.trim() === test.expected.trim();
        setResults((prev: any) => ({ ...prev, [test.id]: passed ? "PASS" : "FAIL" }));
      }
      setTerminal(data.output);
    } else {
      setTerminal("RUNTIME_ERROR: Check syntax or API limits.");
    }
  };

  if (!project) return <div className="p-20 text-white nes-text">LOADING...</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white font-mono">
      <div className="mb-6">
         <Link href="/" className="nes-btn is-small text-[8px]">
           &lt; RETURN_TO_HOME
         </Link>
      </div>
      <h2 className="nes-text is-warning mb-4 uppercase underline">{project.title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nes-container with-title is-dark">
          <p className="title">SOURCE_CODE</p>
          <textarea className="w-full h-80 bg-black text-green-400 p-4 text-xs outline-none" value={userCode} onChange={e => setUserCode(e.target.value)} />
        </div>
        <div className="space-y-4">
          <div className="nes-container with-title is-dark h-40">
            <p className="title">CONSOLE_OUTPUT</p>
            <pre className="text-[10px] text-green-400 overflow-auto h-full">{terminal}</pre>
          </div>
          <button onClick={() => runCode()} className="nes-btn is-success w-full text-[10px]">RUN_CODE</button>
          <div className="nes-container with-title is-dark">
            <p className="title">TEST_SEQUENCES</p>
            {project.test_cases && project.test_cases.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {project.test_cases.map((test: any) => (
                  <div key={test.id} className="flex justify-between items-center bg-gray-800 p-2 border border-gray-600">
                    <span className="text-[8px]">{test.name}</span>
                    <div className="flex gap-2 items-center">
                      <span className={`text-[8px] ${results[test.id] === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                        {results[test.id] || "PENDING"}
                      </span>
                      <button onClick={() => runCode(test)} className="nes-btn is-primary text-[8px]">EXECUTE</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[8px] text-yellow-500 p-2">NO_TEST_CASES_AVAILABLE</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}