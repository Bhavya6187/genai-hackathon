import "@/styles/tailwind.css";
import "@/styles/prosemirror.css";

import cx from "classnames";
import { cal, inter } from "@/styles/fonts";
import { Analytics } from "@vercel/analytics/react";
import Toaster from "./toaster";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Toaster />
      <body 
      className={cx(cal.variable, inter.variable)}
      style={{
        backgroundImage: "url('https://www.transparenttextures.com/patterns/paper.png')",
        backgroundColor: "#F3E5AB"
      }} 
      >
        {children}
      </body>
      <Analytics />
    </html>
  );
}
