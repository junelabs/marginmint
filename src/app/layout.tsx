import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script";

export const metadata = {
  title: "MarginMint — CPG Margin Calculator",
  description: "Free unit economics & margin calculator for indie CPG founders",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Simple Analytics */}
        <Script
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
          data-skip-dnt="false"
          data-collect-dnt="false"
          data-mode="hash"
        />
        <noscript>
          <img
            src="https://queue.simpleanalyticscdn.com/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
