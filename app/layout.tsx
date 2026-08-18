import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arjam Connect",
  description: "Customer inquiry and chatbot prototype for Arjam Travel & Tours"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
