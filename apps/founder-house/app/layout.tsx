import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/outfit";
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
    images: [
      {
        url: "/assets/brand/house-share-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Founder House by TRUVIS · Abu Dhabi",
      },
    ],
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg?v=20261026",
        type: "image/svg+xml",
        sizes: "any",
      },
      {
        url: "/favicon.ico?v=20261026",
        type: "image/x-icon",
        sizes: "16x16 32x32",
      },
    ],
    shortcut: "/favicon.ico?v=20261026",
    apple: { url: "/assets/brand/apple-touch-icon-180.png", sizes: "180x180" },
  },
  manifest: "/house.webmanifest",
  twitter: {
    card: "summary_large_image",
    title: "Founder House by TRUVIS",
    description: "Meet founders, startup teams and investors in Abu Dhabi.",
    images: ["/assets/brand/house-share-1200x630.png"],
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
