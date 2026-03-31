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
        const passed = data.output.trim() === test.expected_output.trim();
        setResults((prev: any) => ({ ...prev, [test.id]: passed ? "PASS" : "FAIL" }));
      }
      setTerminal(data.output);
    } else {
      setTerminal("RUNTIME_ERROR: Check syntax or API limits.");
    }
  };

  if (!project) return <div className="p-20 text-white nes-text">LOADING...</div>;

  return (
    <div className="p-3 bg-gray-900 min-h-screen text-white font-mono">
      <div className="mb-3">
         <Link href="/" className="nes-btn is-small text-[7px]">
           &lt; HOME
         </Link>
      </div>
      <h2 className="nes-text is-warning mb-3 uppercase underline text-[10px]">{project.title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="nes-container with-title is-dark">
          <p className="title text-[6px]">SOURCE_CODE</p>
          <textarea className="w-full h-72 bg-black text-green-400 p-2 text-[6px] outline-none font-mono" value={userCode} onChange={e => setUserCode(e.target.value)} />
        </div>
        <div className="space-y-3">
          <div className="nes-container with-title is-dark h-64">
            <p className="title text-[6px]">CONSOLE</p>
            <pre className="text-[6px] text-green-400 overflow-auto h-full">{terminal}</pre>
          </div>
          <button onClick={() => runCode()} className="nes-btn is-success w-full text-[6px]">RUN</button>
          <div className="nes-container with-title is-dark">
            <p className="title text-[6px]">TESTS</p>
            {project.test_cases && project.test_cases.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {project.test_cases.map((test: any) => (
                  <div key={test.id} className="flex justify-between items-center bg-gray-800 p-1.5 border border-gray-600">
                    <span className="text-[5px] truncate">{test.name}</span>
                    <div className="flex gap-1 items-center">
                      <span className={`text-[5px] ${results[test.id] === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                        {results[test.id] || "—"}
                      </span>
                      <button onClick={() => runCode(test)} className="nes-btn is-primary text-[5px] p-0.5">RUN</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[5px] text-yellow-500 p-1">NO_TESTS</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}