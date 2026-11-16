import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinSuccess | Bản tin thị trường",
  description: "Dashboard chỉ số thị trường và tin kinh tế, chứng khoán trong 24 giờ.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
