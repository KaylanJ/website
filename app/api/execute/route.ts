import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { script, language, stdin, file_name, file_content } = await req.json();
    let finalScript = script;

    if (file_name && file_content) {
      const escaped = file_content.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      if (language === 'python') {
        finalScript = `with open("${file_name}", "w") as f: f.write("${escaped}")\n` + script;
      } else if (language === 'c' || language === 'cpp') {
        const init = `\n#include <stdio.h>\nvoid __init() { FILE *f = fopen("${file_name}", "w"); if(f){fputs("${escaped}", f); fclose(f);}}\n`;
        finalScript = init + script.replace(/int\s+main\s*\(.*?\)\s*\{/, 'int main() { __init();');
      } else if (language === 'java') {
        const jInject = `public static void main(String args[]) { \n try { java.nio.file.Files.writeString(java.nio.file.Path.of("${file_name}"), "${escaped}"); } catch(Exception e) {} \n`;
        finalScript = script.replace(/public\s+static\s+void\s+main\s*\(.*?\)\s*\{/, jInject);
      }
    }

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: finalScript,
        language: language === 'java' ? 'java' : (language === 'python' ? 'python3' : 'c'),
        versionIndex: language === 'java' ? "4" : "0",
        stdin: stdin || ""
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ output: "RUNTIME_ERROR" }, { status: 500 });
  }
}