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
  metadataBase: new URL("https://crtx.chat"),
  title: {
    default: "CRTX — Document Intelligence Platform",
    template: "%s — CRTX",
  },
  description:
    "Ask anything. Get cited answers from your documents — instantly. Upload PDFs or URLs, query with natural language, collaborate with your team. Powered by RAG.",
  keywords: [
    "document intelligence",
    "RAG",
    "retrieval augmented generation",
    "PDF search",
    "AI document search",
    "semantic search",
    "document Q&A",
    "knowledge base AI",
    "cited answers",
    "team collaboration",
  ],
  authors: [{ name: "CRTX", url: "https://crtx.chat" }],
  creator: "CRTX",
  publisher: "CRTX",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://crtx.chat",
  },
  openGraph: {
    type: "website",
    url: "https://crtx.chat",
    title: "CRTX — Document Intelligence Platform",
    description:
      "Ask anything. Get cited answers from your documents — instantly. Upload PDFs or URLs, query with natural language, collaborate with your team.",
    siteName: "CRTX",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CRTX — Document Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRTX — Document Intelligence Platform",
    description:
      "Ask anything. Get cited answers from your documents — instantly.",
    images: ["/opengraph-image"],
  },
  verification: {
    other: {
      "msvalidate.01": "65B3F19B727D95ACDA5EFCF64251E311",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://crtx.chat/#organization",
      name: "CRTX",
      url: "https://crtx.chat",
      logo: "https://crtx.chat/crtx-icon.png",
      description:
        "Document intelligence platform for AI-powered semantic search over PDFs and URLs.",
    },
    {
      "@type": "WebSite",
      "@id": "https://crtx.chat/#website",
      name: "CRTX",
      url: "https://crtx.chat",
      publisher: { "@id": "https://crtx.chat/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://crtx.chat/#app",
      name: "CRTX",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://crtx.chat",
      description:
        "Ask anything. Get cited answers from your documents instantly. Upload PDFs or URLs, query with natural language, collaborate with your team.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "PDF and URL ingestion",
        "Semantic search",
        "Cited answers with source references",
        "Team workspaces and collaboration",
        "Natural language Q&A",
        "Retrieval-augmented generation",
      ],
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
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
