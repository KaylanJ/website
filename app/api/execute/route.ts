import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { script, language, stdin, file_name, file_content } = await req.json();
    let finalScript = script;

    // 1. Map internal names to JDoodle keys & version indices
    const langConfig: { [key: string]: { language: string; versionIndex: string } } = {
      "python3": { language: "python3", versionIndex: "4" },
      "cpp17": { language: "cpp17", versionIndex: "1" }, 
      "c": { language: "c", versionIndex: "5" },
      "java": { language: "java", versionIndex: "4" },
      "nodejs": { language: "nodejs", versionIndex: "4" },
      "csharp": { language: "csharp", versionIndex: "4" },
      "octave": { language: "octave", versionIndex: "4" },
      "racket": { language: "racket", versionIndex: "0" },
      "lua": { language: "lua", versionIndex: "3" },
      "go": { language: "go", versionIndex: "4" },
    };

    // FIX: Fallback to python3 if the requested language isn't in the map
    const config = langConfig[language] || langConfig["python3"];

    // 2. Multi-Language File Injection Logic
    if (file_name && file_content) {
      const escaped = file_content.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      
      switch (language) {
        case 'python3':
          finalScript = `with open("${file_name}", "w") as f: f.write("${escaped}")\n` + script;
          break;
        case 'nodejs':
          finalScript = `require('fs').writeFileSync('${file_name}', "${escaped}");\n` + script;
          break;
        case 'c':
          const cInit = `\n#include <stdio.h>\nvoid __init() { FILE *f = fopen("${file_name}", "w"); if(f){fputs("${escaped}", f); fclose(f);}}\n`;
          finalScript = cInit + script.replace(/int\s+main\s*\(.*?\)\s*\{/, 'int main() { __init();');
          break;
        // ADDED: C++ File Injection
        case 'cpp17':
          const cppInit = `\n#include <fstream>\n#include <string>\nvoid __init() { std::ofstream f("${file_name}"); if(f.is_open()){f << "${escaped}"; f.close();}}\n`;
          finalScript = cppInit + script.replace(/int\s+main\s*\(.*?\)\s*\{/, 'int main() { __init();');
          break;
        case 'java':
          const jInit = `public static void main(String args[]) { \n try { java.nio.file.Files.writeString(java.nio.file.Path.of("${file_name}"), "${escaped}"); } catch(Exception e) {} \n`;
          finalScript = script.replace(/public\s+static\s+void\s+main\s*\(.*?\)\s*\{/, jInit);
          break;
        case 'csharp':
          const csInit = `static void Main(string[] args) { \n System.IO.File.WriteAllText("${file_name}", "${escaped}");\n`;
          finalScript = script.replace(/static\s+void\s+Main\s*\(.*?\)\s*\{/, csInit);
          break;
        case 'octave':
          finalScript = `fid = fopen('${file_name}', 'w'); fputs(fid, '${escaped}'); fclose(fid);\n` + script;
          break;
        case 'racket':
          finalScript = `(with-output-to-file "${file_name}" (lambda () (display "${escaped}")) #:exists 'replace)\n` + script;
          break;
        case 'lua':
          finalScript = `local f = io.open("${file_name}", "w"); f:write("${escaped}"); f:close();\n` + script;
          break;
      }
    }

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: finalScript,
        language: config.language,    // FIX: was config.lang
        versionIndex: config.versionIndex, // FIX: was config.ver
        stdin: stdin || ""
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("EXECUTION_ERROR:", error);
    return NextResponse.json({ output: "SYSTEM_FAILURE: INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}