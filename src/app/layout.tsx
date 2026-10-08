export const runtime = 'edge';
import type { Metadata } from "next";
import { Marhey } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

const marhey = Marhey({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "أسرة مارمينا والبابا كيرلس مرحلة إعدادي",
  description: "Student Attendance Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={marhey.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="bg-pattern min-h-screen">
            <main className="min-h-screen p-4 md:p-8 relative">
              {children}
              <ModeToggle />
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
