import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/newsreader/standard-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://house.truvis.info"),
  title: "Founder House | Founders & Investors in Abu Dhabi",
  description:
    "Meet founders, startup teams and investors in Abu Dhabi through breakfasts, small group conversations and sport. Join the Founder House community by TRUVIS.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Founder House by TRUVIS",
    description:
      "Meet founders and investors in Abu Dhabi. Small events, useful conversations and shared interests.",
    images: ["/assets/community-terrace.webp"],
    type: "website",
  },
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
