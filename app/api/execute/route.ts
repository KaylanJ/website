import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { script, language, stdin, file_name, file_content } = await req.json();
    let finalScript = script;

    // 1. Map internal names to JDoodle keys & version indices
    const langConfig: Record<string, { lang: string, ver: string }> = {
      python: { lang: "python3", ver: "4" },
      c: { lang: "c", ver: "5" },
      java: { lang: "java", ver: "4" },
      nodejs: { lang: "nodejs", ver: "4" },
      csharp: { lang: "csharp", ver: "4" },
      octave: { lang: "octave", ver: "3" },
      racket: { lang: "racket", ver: "2" },
      lua: { lang: "lua", ver: "2" },
      go: { lang: "go", ver: "4" }
    };

    const config = langConfig[language] || langConfig.python;

    // 2. Multi-Language File Injection Logic
    if (file_name && file_content) {
      const escaped = file_content.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      
      switch (language) {
        case 'python':
          finalScript = `with open("${file_name}", "w") as f: f.write("${escaped}")\n` + script;
          break;
        case 'nodejs':
          finalScript = `require('fs').writeFileSync('${file_name}', "${escaped}");\n` + script;
          break;
        case 'c':
          const cInit = `\n#include <stdio.h>\nvoid __init() { FILE *f = fopen("${file_name}", "w"); if(f){fputs("${escaped}", f); fclose(f);}}\n`;
          finalScript = cInit + script.replace(/int\s+main\s*\(.*?\)\s*\{/, 'int main() { __init();');
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
        language: config.lang,
        versionIndex: config.ver,
        stdin: stdin || ""
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("EXECUTION_ERROR:", error);
    return NextResponse.json({ output: "SYSTEM_FAILURE: CHECK_API_CREDENTIALS" }, { status: 500 });
  }
}