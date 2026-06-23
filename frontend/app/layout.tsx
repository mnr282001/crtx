import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./context/auth";
import { CollectionProvider } from "./context/collections";
import { TabProvider } from "./context/tab";
import NavBar from "./components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRTX — Document Intelligence",
  description:
    "Ask anything. Get cited answers from your documents — instantly. Upload PDFs or URLs, ask natural-language questions, collaborate with your team.",
  metadataBase: new URL("https://crtx.chat"),
  openGraph: {
    type: "website",
    url: "https://crtx.chat",
    title: "CRTX — Document Intelligence",
    description:
      "Ask anything. Get cited answers from your documents — instantly.",
    siteName: "CRTX",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CRTX — Document Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRTX — Document Intelligence",
    description:
      "Ask anything. Get cited answers from your documents — instantly.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CollectionProvider>
            <TabProvider>
              <NavBar />
              {children}
            </TabProvider>
          </CollectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
