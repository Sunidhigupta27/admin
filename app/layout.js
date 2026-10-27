import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/config";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

export const metadata = {
  title: `${APP_NAME} | Admin`,
  description: "Admin panel: approve creators, post ads and videos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
