import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteLayout from "@/components/SiteLayout";

export const metadata: Metadata = {
  title: "CareerForge | AI Resume Optimizer",
  description: "AI-powered resume optimizer that tailors your application in real-time for your dream role.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col text-white font-sans relative">
        <Providers>
          <SiteLayout>
            {children}
          </SiteLayout>
        </Providers>
      </body>
    </html>
  );
}
