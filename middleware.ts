import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Use your Service Role Key here for server-side bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;

  // 1. Filter out static files (images, css, etc.) to avoid bloating logs
  if (
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.includes('/api/') ||
    nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Collect Visitor Data
  // 2. Collect Visitor Data
// 2. Collect Visitor Data
  const visitorData = {
    path: nextUrl.pathname,
    referer: headers.get('referer') || 'Direct',
    ip_address: headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown',
    // We cast 'req' to 'any' here to tell TypeScript "I know Vercel adds this"
    city: (req as any).geo?.city || 'Unknown',
    region: (req as any).geo?.region || 'Unknown',
    country: (req as any).geo?.country || 'Unknown',
    user_agent: headers.get('user-agent') || 'Unknown',
  };

  // 3. Fire and forget the log (Don't 'await' it if you want the page to load fast)
  supabase.from('visitor_logs').insert(visitorData).then(({ error }) => {
    if (error) console.error('Log Error:', error.message);
  });

  return NextResponse.next();
}