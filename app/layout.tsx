import "nes.css/css/nes.min.css";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Press Start 2P', cursive", backgroundColor: "#212529" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}