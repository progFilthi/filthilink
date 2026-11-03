import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Privacy Policy — FilthiLink",
  description:
    "How FilthiLink collects, uses, stores, and shares your information, including data received from Google Sign-In.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-24">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: November 3, 2026
          </p>
        </div>

        <p className="mb-14 text-[15px] leading-relaxed text-foreground/80">
          This Privacy Policy explains how FilthiLink (&quot;FilthiLink&quot;, &quot;we&quot;, &quot;us&quot;)
          collects, uses, stores, and shares information when you use the URL
          shortening service at{" "}
          <a
            href="https://filthilink.store"
            className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            filthilink.store
          </a>{" "}
          and its related API (together, the &quot;Service&quot;). It applies to
          visitors who only click short links, to registered users, and to
          anyone who signs in with a Google Account.
        </p>

        <div className="space-y-12">
          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Information you provide.
              </span>{" "}
              When you create an account we collect your email address and
              password (stored only as a salted hash), or, if you sign in with
              Google, the account details described in section 3. If you contact
              us, we receive your message and email address.
            </p>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Content you create.
              </span>{" "}
              The destination URLs you shorten, the short codes generated for
              them, custom codes you choose, and the titles, tags, and notes you
              attach.
            </p>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Payment information.
              </span>{" "}
              Paid plans are processed by Dodo Payments. We receive a customer
              identifier, subscription status, plan, and billing period. We never
              receive or store your full card number, CVC, or bank details — they
              are entered directly on the payment provider&apos;s hosted checkout.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Technical information.
              </span>{" "}
              When you use the Service we automatically receive the IP address
              that made the request, the requested path, the referring page, and
              your browser&apos;s user agent. This is used to operate and secure
              the Service and is kept in server logs for a limited period
              (section 7).
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. Cookies and Local Storage
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              We use strictly necessary storage only. After you sign in we store a
              short-lived access token and a refresh token in your browser so you
              stay logged in and so requests to our API can be authenticated.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              We do not use advertising cookies, we do not run third-party
              tracking pixels, and we do not build advertising profiles. Clearing
              your browser storage or signing out ends your session.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. Google User Data
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              You can create an account or sign in using &quot;Sign in with
              Google&quot;. When you do, Google issues an identity token to your
              browser, which we send to our server and verify. That token
              contains, and we receive, only the following:{" "}
              <span className="font-medium text-foreground">
                your email address, whether that email is verified, your name,
                your profile picture URL, and your Google account identifier
              </span>
              .
            </p>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              We use this information for one purpose: to authenticate you and to
              create or match your FilthiLink account. We request only the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">
                openid
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">
                email
              </code>
              , and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-[13px]">
                profile
              </code>{" "}
              scopes.
            </p>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              We do <span className="font-medium text-foreground">not</span>{" "}
              request access to Gmail, Google Drive, Google Calendar, Google
              Contacts, or any other Google product data. We never receive or
              store your Google password. We do not retain Google OAuth access or
              refresh tokens — the identity token is verified on our server and
              discarded, and you are issued a FilthiLink session instead.
            </p>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              FilthiLink&apos;s use of information received from Google APIs
              adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Google user data is not
              used for advertising, is not sold, is not used to train generalized
              AI or machine-learning models, and is not shared with third parties
              except as described in section 6 or as necessary to provide the
              Service.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              You can revoke FilthiLink&apos;s access to your Google Account at
              any time at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                myaccount.google.com/permissions
              </a>
              . Revoking access stops future sign-ins but does not delete your
              existing FilthiLink account — see section 9 for that.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. How We Use Information
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-relaxed text-muted-foreground">
              <li>To create and authenticate your account and keep you signed in</li>
              <li>To create short links and redirect visitors to their destinations</li>
              <li>To show your link history, usage counts, and account dashboard</li>
              <li>To manage paid plans, process payments, and handle billing enquiries</li>
              <li>To detect, prevent, and investigate abuse, spam, and fraud</li>
              <li>To diagnose errors, maintain availability, and improve the Service</li>
              <li>To respond to support requests and legal obligations</li>
            </ul>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. Legal Bases (where GDPR applies)
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              We process personal data to perform our contract with you (providing
              the Service), on the basis of our legitimate interests (securing the
              Service, preventing abuse, improving reliability), to comply with
              legal obligations (tax and accounting records), and with your
              consent where consent is required (for example, optional account
              features).
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. How We Share Information
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              We do not sell your personal information, we do not rent it, and we
              do not share it for cross-context behavioural advertising. We share
              it only with the service providers that operate the Service, and
              only the minimum needed for their function:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] text-muted-foreground">
                <thead className="text-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4 font-medium">Provider</th>
                    <th className="py-2 pr-4 font-medium">Purpose</th>
                    <th className="py-2 font-medium">Data involved</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Google LLC</td>
                    <td className="py-2 pr-4">Sign in with Google</td>
                    <td className="py-2">Identity token contents (section 3)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Dodo Payments</td>
                    <td className="py-2 pr-4">Payment processing, subscriptions</td>
                    <td className="py-2">Email, customer ID, billing details</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Vercel Inc.</td>
                    <td className="py-2 pr-4">Web app hosting and delivery</td>
                    <td className="py-2">Request metadata, server logs</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Contabo GmbH</td>
                    <td className="py-2 pr-4">API and database hosting</td>
                    <td className="py-2">Account and link data at rest</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Namecheap Inc.</td>
                    <td className="py-2 pr-4">Domain registration and DNS</td>
                    <td className="py-2">Domain contact records</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              We may also disclose information where required by law, legal
              process, or a lawful request from a public authority, or where
              necessary to protect the rights, safety, or security of FilthiLink,
              our users, or the public. If FilthiLink is involved in a merger,
              acquisition, or sale of assets, information may be transferred as
              part of that transaction; we will tell you before that happens.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-[15px] leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Account data</span>{" "}
                — kept while your account exists, deleted within 30 days of a
                deletion request.
              </li>
              <li>
                <span className="font-medium text-foreground">Links and codes</span>{" "}
                — kept until you delete them or delete your account. A deleted
                short code stops redirecting immediately.
              </li>
              <li>
                <span className="font-medium text-foreground">Server logs</span> —
                kept up to 30 days for security and troubleshooting, then
                deleted or aggregated.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Billing records
                </span>{" "}
                — retained for as long as tax and accounting law requires
                (typically up to 7 years), even after account deletion.
              </li>
            </ul>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              8. Security and International Transfers
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              Passwords are stored as salted hashes, sessions use signed tokens
              with short expiry, and traffic between your browser and the Service
              is encrypted with TLS. Access to production systems is restricted.
              No method of storage or transmission is completely secure, so we
              cannot guarantee absolute security.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Our providers operate in the United States and the European Union,
              so your information may be processed outside your country. Where
              required, transfers rely on appropriate safeguards such as the
              European Commission&apos;s Standard Contractual Clauses.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              9. Your Rights
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
              Depending on where you live you may have the right to access,
              correct, export, or delete your personal information, to object to
              or restrict certain processing, and to withdraw consent. You can
              delete your links from the dashboard at any time.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              To exercise any of these rights, email us at the address in section
              13. We respond within 30 days and may ask you to verify that you
              control the account. You also have the right to complain to your
              local data protection authority.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              10. Children
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              The Service is not directed to children under 13 (or under 16 where
              local law sets a higher age), and we do not knowingly collect their
              personal information. If you believe a child has provided us with
              personal information, contact us and we will delete it.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              11. Do Not Track and Third-Party Links
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              We do not track you across third-party websites. Short links you
              create or click may lead to websites we do not operate; their
              privacy practices are governed by their own policies, not this one.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              12. Changes to This Policy
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              We may update this Privacy Policy to reflect changes in the Service
              or the law. If a change materially affects how we handle your
              information, we will notify registered users by email or in-app
              before it takes effect. The date at the top of this page always
              shows the current version.
            </p>
          </section>

          <section className="relative pl-6 border-l-2 border-primary/30">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              13. Contact
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Questions about this Privacy Policy, or requests about your data,
              can be sent to{" "}
              <a
                href="mailto:gamerfilthi@gmail.com"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                gamerfilthi@gmail.com
              </a>
              . We aim to reply within 30 days.
            </p>
          </section>
        </div>

        <div className="mt-16 rounded-xl border bg-card p-6">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            By using the Service, you acknowledge that you have read and
            understood this Privacy Policy. See also our{" "}
            <a
              href="/terms"
              className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
            >
              Terms of Service
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
