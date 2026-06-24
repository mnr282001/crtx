import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the CRTX document intelligence platform.",
  alternates: {
    canonical: "https://crtx.chat/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const EFFECTIVE_DATE = "June 23, 2026";

const sections = [
  {
    id: "agreement",
    title: "1. Agreement to Terms",
    content: (
      <>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) are a legally binding agreement between you (&ldquo;you&rdquo;
          or &ldquo;User&rdquo;) and CRTX (&ldquo;CRTX,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) governing your access to and use of the document intelligence platform available at{" "}
          <strong>crtx.chat</strong> (the &ldquo;Service&rdquo;).
        </p>
        <p>
          By creating an account, clicking &ldquo;Accept,&rdquo; or otherwise using the Service, you confirm that you
          have read, understood, and agree to be bound by these Terms and our{" "}
          <Link href="/privacy">Privacy Policy</Link>, which is incorporated by reference. If you are using the Service
          on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
        </p>
        <p>
          If you do not agree to these Terms, you may not use the Service.
        </p>
      </>
    ),
  },
  {
    id: "service-description",
    title: "2. Description of Service",
    content: (
      <>
        <p>
          CRTX is a document intelligence platform that enables users to upload PDF documents and URLs, extract and
          index their content using machine learning techniques, and query that content in natural language using
          AI-powered retrieval-augmented generation (&ldquo;RAG&rdquo;). The Service also supports collaborative
          workspaces in which multiple users can access shared document collections.
        </p>
        <p>
          The Service integrates third-party AI inference services to generate answers. Answers produced by the Service
          are AI-generated and may contain errors, omissions, or inaccuracies. See Section 9 (Disclaimers) for
          important limitations.
        </p>
        <p>
          We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable
          notice where practicable.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "3. Accounts and Eligibility",
    content: (
      <>
        <h3>3.1 Eligibility</h3>
        <p>
          You must be at least 16 years old (or the age of digital consent in your jurisdiction, if higher) to use the
          Service. By using the Service, you represent and warrant that you meet this requirement.
        </p>

        <h3>3.2 Account Registration</h3>
        <p>
          You must register an account to access most features. You agree to provide accurate, current, and complete
          information during registration and to keep your account information up to date. You are responsible for
          maintaining the confidentiality of your login credentials and for all activity that occurs under your account.
        </p>

        <h3>3.3 Account Security</h3>
        <p>
          You must notify us immediately at <a href="mailto:onboarding@vesselapplications.com">onboarding@vesselapplications.com</a> if you suspect
          unauthorized access to your account. We are not liable for any loss or damage arising from unauthorized use
          of your credentials where you have failed to maintain adequate security or to notify us promptly.
        </p>

        <h3>3.4 One Account per User</h3>
        <p>
          You may not create multiple accounts to circumvent usage limits, suspensions, or any other restrictions we
          impose. Accounts created for automation or bulk data extraction without prior written permission are
          prohibited.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    content: (
      <>
        <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
        <ul>
          <li>
            Upload, submit, or process any content that infringes the intellectual property rights, privacy rights, or
            other legal rights of any third party;
          </li>
          <li>
            Upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, obscene, or otherwise
            objectionable;
          </li>
          <li>
            Upload documents containing sensitive personal data of third parties (e.g., healthcare records, financial
            records, government-issued IDs) unless you have a lawful basis to process and share such data with us and
            our sub-processors;
          </li>
          <li>
            Attempt to reverse engineer, decompile, disassemble, or derive the source code of the Service or any
            underlying AI models;
          </li>
          <li>
            Scrape, crawl, or systematically extract data from the Service using automated means without prior written
            consent;
          </li>
          <li>
            Use the Service to develop a competing product or service, or to benchmark AI model outputs for commercial
            purposes without our written consent;
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the Service or its underlying infrastructure;
          </li>
          <li>
            Circumvent, disable, or otherwise interfere with security features of the Service;
          </li>
          <li>
            Attempt to gain unauthorized access to any account, system, or network connected to the Service;
          </li>
          <li>
            Transmit malware, viruses, or any code designed to damage, intercept, or expropriate data.
          </li>
        </ul>
        <p>
          We may investigate and take appropriate action, including suspension or termination of your account and
          reporting to law enforcement, if we reasonably believe you have violated this section.
        </p>
      </>
    ),
  },
  {
    id: "user-content",
    title: "5. User Content",
    content: (
      <>
        <h3>5.1 Your Ownership</h3>
        <p>
          You retain full ownership of all documents, text, and other materials you upload to the Service
          (&ldquo;User Content&rdquo;). These Terms do not transfer any intellectual property rights to us.
        </p>

        <h3>5.2 License to CRTX</h3>
        <p>
          By uploading User Content, you grant CRTX a non-exclusive, worldwide, royalty-free license to store,
          process, reproduce, and transmit your User Content solely to the extent necessary to provide the Service to
          you. This includes sending document text to third-party AI inference providers to generate answers in
          response to your queries. This license terminates when you delete the content or close your account, subject
          to the data retention periods described in our Privacy Policy.
        </p>

        <h3>5.3 Your Representations</h3>
        <p>
          You represent and warrant that: (a) you own or have the necessary rights and permissions to upload and
          process your User Content; (b) your User Content does not violate any applicable law or third-party rights;
          and (c) you have all necessary consents to share any personal data contained in your User Content with us
          and our sub-processors.
        </p>

        <h3>5.4 No Training Use</h3>
        <p>
          We will not use your User Content or query history to train or fine-tune AI models without your explicit
          opt-in consent.
        </p>

        <h3>5.5 Content Moderation</h3>
        <p>
          We reserve the right (but not the obligation) to review, reject, or remove User Content that we reasonably
          believe violates these Terms or applicable law.
        </p>
      </>
    ),
  },
  {
    id: "collaboration",
    title: "6. Collaborative Workspaces",
    content: (
      <>
        <p>
          The Service allows you to create shared collections and invite other users. When you share a collection, you
          are responsible for ensuring that the members you invite are authorized to access the documents contained
          within it. You must not share collections containing confidential or proprietary third-party information with
          users who are not authorized by the content owner.
        </p>
        <p>
          You are the collection owner and remain responsible for all content stored in collections you create,
          including content uploaded by members you have granted ingest permissions.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: (
      <>
        <h3>7.1 CRTX Ownership</h3>
        <p>
          The Service, including its software, design, user interface, trademarks, logos, and all content we create
          (excluding User Content), are owned by CRTX and protected by copyright, trademark, and other intellectual
          property laws. You may not copy, modify, distribute, sell, or sublicense any part of the Service except as
          expressly permitted by these Terms.
        </p>

        <h3>7.2 Feedback</h3>
        <p>
          If you provide suggestions, ideas, or feedback about the Service (&ldquo;Feedback&rdquo;), you grant us a
          perpetual, irrevocable, royalty-free license to use that Feedback for any purpose without compensation or
          attribution to you.
        </p>

        <h3>7.3 AI-Generated Outputs</h3>
        <p>
          Answers and summaries generated by the Service are produced by AI models operating on your User Content. To
          the extent that such outputs are copyrightable, we make no claim of ownership. However, because AI-generated
          content may reflect patterns from training data, we make no warranty that outputs are original or free from
          third-party intellectual property claims. You are solely responsible for reviewing outputs before relying on
          or publishing them.
        </p>
      </>
    ),
  },
  {
    id: "payment",
    title: "8. Billing and Payment",
    content: (
      <>
        <p>
          Certain features or usage tiers of the Service may require payment. Where a paid plan is offered:
        </p>
        <ul>
          <li>
            Fees are stated at the point of purchase and are exclusive of applicable taxes, which you are responsible
            for paying;
          </li>
          <li>
            All payments are non-refundable except where required by applicable law or expressly stated in our current
            refund policy;
          </li>
          <li>
            We may change pricing with 30 days&apos; advance notice; continued use of the Service after the effective
            date of a price change constitutes acceptance;
          </li>
          <li>
            Failure to pay may result in suspension or downgrade of your account.
          </li>
        </ul>
        <p>
          If no paid plan currently exists, this section will apply when paid plans are introduced.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers",
    content: (
      <>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
          EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p>
          AI-generated answers are produced by language models that can make mistakes, hallucinate information, omit
          relevant context, or produce outdated results. <strong>You must not rely on AI-generated answers as
          professional legal, medical, financial, regulatory, or other expert advice.</strong> Always verify critical
          information with qualified professionals and authoritative sources.
        </p>
        <p>
          We do not warrant that: (a) the Service will be uninterrupted, timely, secure, or error-free; (b) results
          obtained from use of the Service will be accurate or reliable; or (c) the quality of any information
          obtained through the Service will meet your expectations.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "10. Limitation of Liability",
    content: (
      <>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CRTX, ITS AFFILIATES, DIRECTORS,
          EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY:
        </p>
        <ul>
          <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES;</li>
          <li>LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES;</li>
          <li>COST OF SUBSTITUTE GOODS OR SERVICES;</li>
        </ul>
        <p>
          ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE
          BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS
          ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT
          YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD $100.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion or limitation of certain warranties or damages. In such
          jurisdictions, our liability is limited to the fullest extent permitted by law.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "11. Indemnification",
    content: (
      <>
        <p>
          You agree to indemnify, defend, and hold harmless CRTX and its affiliates, officers, directors, employees,
          and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including
          reasonable legal fees) arising out of or relating to: (a) your use of the Service in violation of these
          Terms; (b) your User Content; (c) your violation of any applicable law or third-party rights; or (d) any
          dispute between you and another user.
        </p>
        <p>
          We reserve the right to assume exclusive control of the defense of any matter subject to indemnification by
          you, at your expense. You must not settle any such matter without our prior written consent.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "12. Termination",
    content: (
      <>
        <h3>12.1 By You</h3>
        <p>
          You may stop using the Service and delete your account at any time from your account settings. Upon deletion,
          we will process your data as described in our Privacy Policy.
        </p>

        <h3>12.2 By Us</h3>
        <p>
          We may suspend or terminate your access to the Service at any time, with or without cause, with or without
          notice. We will typically provide advance notice and a reason unless we determine that immediate action is
          necessary due to a legal requirement, security threat, or serious policy violation.
        </p>

        <h3>12.3 Effect of Termination</h3>
        <p>
          Upon termination: (a) your right to use the Service immediately ceases; (b) we will delete or anonymize your
          data per our Privacy Policy; (c) Sections 5.3, 7, 9, 10, 11, 13, and 14 survive termination.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "13. Governing Law and Disputes",
    content: (
      <>
        <h3>13.1 Governing Law</h3>
        <p>
          These Terms are governed by and construed in accordance with the laws of the State of Delaware, United
          States, without regard to its conflict-of-law principles.
        </p>

        <h3>13.2 Informal Resolution</h3>
        <p>
          Before initiating formal proceedings, you agree to contact us at{" "}
          <a href="mailto:onboarding@vesselapplications.com">onboarding@vesselapplications.com</a> and attempt to resolve the dispute informally for at
          least 30 days.
        </p>

        <h3>13.3 Binding Arbitration</h3>
        <p>
          If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms
          or the Service shall be resolved by binding arbitration administered by the American Arbitration Association
          under its Commercial Arbitration Rules. The arbitration shall be conducted in English. The arbitrator&apos;s
          decision will be final and binding. YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR
          CLASS-WIDE ARBITRATION.
        </p>

        <h3>13.4 Exceptions</h3>
        <p>
          Notwithstanding Section 13.3, either party may seek emergency injunctive relief in a court of competent
          jurisdiction to prevent irreparable harm pending arbitration. Nothing in this section prevents you from
          reporting issues to applicable regulatory authorities.
        </p>
      </>
    ),
  },
  {
    id: "general",
    title: "14. General Provisions",
    content: (
      <>
        <h3>14.1 Entire Agreement</h3>
        <p>
          These Terms, together with our Privacy Policy and any additional terms you have agreed to for specific
          features, constitute the entire agreement between you and CRTX regarding the Service and supersede all prior
          agreements.
        </p>

        <h3>14.2 Severability</h3>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full
          force and effect. The unenforceable provision will be modified to the minimum extent necessary to make it
          enforceable.
        </p>

        <h3>14.3 No Waiver</h3>
        <p>
          Our failure to enforce any right or provision of these Terms will not be deemed a waiver of that right or
          provision. Any waiver must be in writing signed by an authorized representative of CRTX.
        </p>

        <h3>14.4 Assignment</h3>
        <p>
          You may not assign or transfer your rights or obligations under these Terms without our prior written
          consent. We may freely assign these Terms, including in connection with a merger, acquisition, or sale of
          assets, with notice to you.
        </p>

        <h3>14.5 Force Majeure</h3>
        <p>
          We are not liable for any failure or delay in performance caused by circumstances beyond our reasonable
          control, including natural disasters, war, terrorism, labor disputes, government actions, internet outages,
          or failures of third-party services.
        </p>

        <h3>14.6 Changes to Terms</h3>
        <p>
          We may update these Terms from time to time. For material changes, we will provide at least 14 days&apos;
          notice via email or a prominent in-app notice before the changes take effect. Continued use of the Service
          after the effective date constitutes your acceptance of the revised Terms. If you do not agree to the revised
          Terms, you must stop using the Service and delete your account.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "15. Contact",
    content: (
      <>
        <p>For questions about these Terms, contact us:</p>
        <ul>
          <li>
            Email: <a href="mailto:onboarding@vesselapplications.com">onboarding@vesselapplications.com</a>
          </li>
          <li>Website: crtx.chat</li>
        </ul>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto w-full px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em]">Legal</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50">Terms of Service</h1>
          <p className="text-sm font-mono text-zinc-500">
            Effective date: {EFFECTIVE_DATE}
          </p>
          <p className="text-zinc-400 text-base leading-relaxed">
            Please read these terms carefully before using CRTX. They govern your rights and responsibilities when
            using our platform.
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
        <div className="flex flex-col gap-12">
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
            <Link href="/privacy" className="text-xs font-mono text-zinc-500 hover:text-sky-400 transition-colors">
              Privacy Policy
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
