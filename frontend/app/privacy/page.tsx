import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — CRTX",
  description: "How CRTX collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "June 23, 2026";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    content: (
      <>
        <p>
          CRTX (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the document intelligence platform
          available at <strong>crtx.chat</strong> (the &ldquo;Service&rdquo;). This Privacy Policy explains what
          information we collect, how we use it, with whom we share it, and the choices you have.
        </p>
        <p>
          By creating an account or using the Service, you agree to the practices described here. If you do not agree,
          do not use the Service.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: (
      <>
        <h3>2.1 Account Information</h3>
        <p>
          When you register, we collect your email address and any profile details you provide. Authentication is handled
          through Supabase Auth, which may record your IP address and browser metadata at sign-in.
        </p>

        <h3>2.2 Content You Upload</h3>
        <p>
          The Service allows you to upload PDF documents and submit URLs for ingestion. We store the original files and
          the text, tables, and images extracted from them. We also generate and store vector embeddings of your content
          to power semantic search.
        </p>

        <h3>2.3 Queries and Interactions</h3>
        <p>
          We store the natural-language questions you submit, the answers returned by the AI, and citation metadata
          (which document chunks were retrieved). This data is used to provide the Service and to improve response
          quality.
        </p>

        <h3>2.4 Usage and Technical Data</h3>
        <p>
          We automatically collect log data including your IP address, browser type and version, operating system,
          referring URLs, pages visited within the Service, timestamps, and error reports. We use this data for security
          monitoring, debugging, and aggregate analytics.
        </p>

        <h3>2.5 Cookies and Similar Technologies</h3>
        <p>
          We use strictly necessary session cookies to keep you logged in. We do not currently use advertising or
          third-party tracking cookies. If this changes, we will update this policy and, where required, obtain your
          consent.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: (
      <>
        <p>We use your information to:</p>
        <ul>
          <li>Provide, operate, and maintain the Service and your workspace;</li>
          <li>Process documents you upload and answer your queries via AI-powered retrieval;</li>
          <li>Send transactional emails (account confirmation, password reset, collaboration invitations);</li>
          <li>Monitor for abuse, security threats, and policy violations;</li>
          <li>Debug, fix, and improve the Service;</li>
          <li>Comply with legal obligations;</li>
          <li>Enforce our Terms of Service.</li>
        </ul>
        <p>
          We do not use your uploaded documents or query history to train or fine-tune AI models without your explicit
          opt-in consent.
        </p>
      </>
    ),
  },
  {
    id: "legal-basis",
    title: "4. Legal Basis for Processing (EEA / UK Users)",
    content: (
      <>
        <p>
          If you are located in the European Economic Area or the United Kingdom, we process your personal data under
          the following legal bases:
        </p>
        <ul>
          <li>
            <strong>Contract performance</strong> — to provide the Service you requested;
          </li>
          <li>
            <strong>Legitimate interests</strong> — security monitoring, fraud prevention, product analytics, and
            service improvement, where those interests are not overridden by your rights;
          </li>
          <li>
            <strong>Legal obligation</strong> — where processing is required by applicable law;
          </li>
          <li>
            <strong>Consent</strong> — for optional features or communications, where we ask you first.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "5. How We Share Your Information",
    content: (
      <>
        <p>
          We do not sell your personal data. We share it only as described below:
        </p>

        <h3>5.1 Service Providers (Sub-processors)</h3>
        <p>
          We engage third-party companies to operate the Service. These sub-processors access your data only as
          instructed and are bound by confidentiality and data-processing agreements:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database, file storage, and authentication infrastructure;
          </li>
          <li>
            <strong>Pinecone</strong> — vector database for semantic search;
          </li>
          <li>
            <strong>AI inference providers</strong> — large language model providers used to generate answers from
            retrieved document chunks (e.g., Anthropic). Your document text and queries may be sent to these providers
            solely to generate your requested answers;
          </li>
          <li>
            <strong>Hosting and CDN providers</strong> — infrastructure used to serve the application.
          </li>
        </ul>

        <h3>5.2 Collaboration</h3>
        <p>
          If you share a collection with other users, members of that collection can view the documents and query
          results within it, according to the permission level you set.
        </p>

        <h3>5.3 Legal Requirements</h3>
        <p>
          We may disclose your information if required by law, court order, or government authority, or where we
          believe disclosure is necessary to protect our rights, your safety, or the safety of others.
        </p>

        <h3>5.4 Business Transfers</h3>
        <p>
          If CRTX is involved in a merger, acquisition, or asset sale, your information may be transferred as part of
          that transaction. We will notify you via email or a prominent notice on the Service before your personal data
          is transferred and becomes subject to a different privacy policy.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "6. Data Retention",
    content: (
      <>
        <p>
          We retain your account data and uploaded content for as long as your account is active. If you delete a
          document or collection, it is removed from our primary database within 30 days; vector embeddings are removed
          from Pinecone within the same period.
        </p>
        <p>
          If you delete your account, we delete or anonymize all personal data within 90 days, except where we are
          required to retain it by law (e.g., tax or fraud-prevention records) or where data is held in encrypted
          backups that are purged on a rolling cycle.
        </p>
        <p>
          Aggregate, anonymized analytics data that cannot be linked back to you may be retained indefinitely.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "7. Security",
    content: (
      <>
        <p>
          We implement technical and organizational measures designed to protect your data against unauthorized access,
          disclosure, alteration, or destruction. These include:
        </p>
        <ul>
          <li>Encryption in transit (TLS) and at rest for stored files and database records;</li>
          <li>Row-level security policies that restrict database access to your own data;</li>
          <li>Access controls limiting employee access to the minimum necessary;</li>
          <li>Regular dependency and security audits.</li>
        </ul>
        <p>
          No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect
          your information, we cannot guarantee absolute security. If you become aware of a security vulnerability,
          please contact us immediately at{" "}
          <a href="mailto:security@crtx.chat">security@crtx.chat</a>.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "8. Your Rights",
    content: (
      <>
        <p>
          Depending on your location, you may have the following rights regarding your personal data:
        </p>

        <h3>8.1 All Users</h3>
        <ul>
          <li>
            <strong>Access</strong> — request a copy of the personal data we hold about you;
          </li>
          <li>
            <strong>Correction</strong> — request correction of inaccurate or incomplete data;
          </li>
          <li>
            <strong>Deletion</strong> — request deletion of your personal data, subject to legal retention obligations;
          </li>
          <li>
            <strong>Data portability</strong> — receive your data in a structured, machine-readable format.
          </li>
        </ul>

        <h3>8.2 EEA / UK Users (GDPR)</h3>
        <p>
          In addition to the rights above, you may object to processing based on legitimate interests, request
          restriction of processing, and withdraw consent where processing is consent-based. You also have the right
          to lodge a complaint with your local supervisory authority.
        </p>

        <h3>8.3 California Residents (CCPA / CPRA)</h3>
        <p>
          California residents have the right to know what personal information we collect and how it is used and
          shared, to delete personal information, to correct inaccurate personal information, to opt out of the sale
          or sharing of personal information (we do not sell or share personal information for cross-context behavioral
          advertising), and to non-discrimination for exercising these rights.
        </p>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:privacy@crtx.chat">privacy@crtx.chat</a>. We will respond within the timeframe required by
          applicable law (typically 30 days). We may need to verify your identity before fulfilling a request.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "9. International Data Transfers",
    content: (
      <>
        <p>
          Our infrastructure is primarily hosted in the United States. If you are located outside the United States,
          your data is transferred to and processed in the US. We rely on Standard Contractual Clauses approved by the
          European Commission, or other lawful transfer mechanisms, when transferring personal data from the EEA, UK,
          or Switzerland to the US.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "10. Children's Privacy",
    content: (
      <>
        <p>
          The Service is not directed to children under the age of 16. We do not knowingly collect personal
          information from children under 16. If you believe we have collected information from a child under 16,
          contact us at <a href="mailto:privacy@crtx.chat">privacy@crtx.chat</a> and we will delete it promptly.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "11. Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time. When we make material changes, we will notify you by
          email (at the address associated with your account) or by displaying a prominent notice in the Service at
          least 14 days before the changes take effect. Continued use of the Service after the effective date
          constitutes acceptance of the updated policy.
        </p>
        <p>
          The &ldquo;Last Updated&rdquo; date at the top of this page reflects when the most recent changes were made.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: (
      <>
        <p>
          If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
        </p>
        <ul>
          <li>
            Email: <a href="mailto:privacy@crtx.chat">privacy@crtx.chat</a>
          </li>
          <li>Website: crtx.chat</li>
        </ul>
        <p>
          For formal data protection requests under GDPR or CCPA, please include &ldquo;Data Subject Request&rdquo; in
          your subject line.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto w-full px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em]">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50">Privacy Policy</h1>
          <p className="text-sm font-mono text-zinc-500">
            Last updated: {EFFECTIVE_DATE}
          </p>
          <p className="text-zinc-400 text-base leading-relaxed">
            This policy describes how CRTX handles your personal data when you use our document intelligence platform.
            We&apos;ve written it to be readable — not just legally complete.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mb-12 border border-zinc-800 p-6">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">Contents</p>
          <ol className="flex flex-col gap-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-zinc-400 hover:text-sky-400 font-mono transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="prose-legal flex flex-col gap-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="flex flex-col gap-4 scroll-mt-8">
              <h2 className="text-xl font-bold text-zinc-100 border-b border-zinc-800 pb-3">{s.title}</h2>
              <div className="legal-body">{s.content}</div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <p className="text-xs font-mono text-zinc-600">
            &copy; {new Date().getFullYear()} CRTX. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-xs font-mono text-zinc-500 hover:text-sky-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="text-xs font-mono text-zinc-500 hover:text-sky-400 transition-colors">
              Back to app
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .legal-body p { margin-bottom: 0.75rem; color: #a1a1aa; line-height: 1.75; font-size: 0.9375rem; }
        .legal-body p:last-child { margin-bottom: 0; }
        .legal-body h3 { color: #d4d4d8; font-weight: 600; font-size: 0.9375rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .legal-body ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; margin: 0.5rem 0 0.75rem 0; }
        .legal-body ul li { color: #a1a1aa; font-size: 0.9375rem; line-height: 1.7; padding-left: 1.25rem; position: relative; }
        .legal-body ul li::before { content: "—"; position: absolute; left: 0; color: #38bdf8; font-size: 0.75rem; top: 0.25rem; }
        .legal-body strong { color: #d4d4d8; font-weight: 600; }
        .legal-body a { color: #38bdf8; text-decoration: none; }
        .legal-body a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
