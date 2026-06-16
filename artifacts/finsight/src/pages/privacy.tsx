export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-foreground">
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 16, 2026</p>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        SpendHalo ("we", "our", or "us") is committed to protecting your privacy. This policy
        explains what information we collect, how we use it, and your rights.
      </p>

      <Section title="1. Information We Collect">
        <p>We collect information you provide directly when using SpendHalo:</p>
        <ul>
          <li><strong>Financial data</strong> — transaction amounts, categories, dates, and notes you enter manually.</li>
          <li><strong>Profile data</strong> — your name, hourly wage, currency preference, and monthly goals.</li>
          <li><strong>Mood logs</strong> — optional emotional state entries you associate with spending.</li>
          <li><strong>Device identifier</strong> — a randomly generated anonymous ID stored locally on your device to persist your session. We do not collect your name, email, or any personally identifiable information unless you choose to provide it.</li>
        </ul>
        <p>We do <strong>not</strong> connect to your bank accounts, read your financial institution data, or access any external financial services.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>To provide and improve the SpendHalo app and its features.</li>
          <li>To process subscription payments through Stripe (if you upgrade to Pro).</li>
          <li>To calculate insights such as time cost, spending patterns, and regret scores — all processed on our servers and returned only to you.</li>
        </ul>
        <p>We do not sell your data. We do not share your financial data with third parties, advertisers, or data brokers.</p>
      </Section>

      <Section title="3. Data Storage & Security">
        <p>
          Your data is stored in a secure PostgreSQL database hosted on Replit infrastructure.
          Data is transmitted over HTTPS/TLS at all times. We implement industry-standard
          security practices to protect your information.
        </p>
        <p>
          Budget preferences and Pro status are also cached locally on your device using
          secure device storage (AsyncStorage on mobile).
        </p>
      </Section>

      <Section title="4. Payments">
        <p>
          If you subscribe to SpendHalo Pro, payments are processed by{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Stripe
          </a>
          . We do not store or have access to your full credit card number. Stripe may collect
          billing information per their own privacy policy.
        </p>
      </Section>

      <Section title="5. Data Retention">
        <p>
          We retain your data for as long as your account is active. You may request deletion
          of your data at any time by contacting us at{" "}
          <a href="mailto:hello@spendhalo.app" className="text-primary underline underline-offset-2">
            hello@spendhalo.app
          </a>
          . We will delete your data within 30 days of your request.
        </p>
      </Section>

      <Section title="6. Children's Privacy">
        <p>
          SpendHalo is not directed at children under 13. We do not knowingly collect
          personal information from children under 13. If you believe a child has provided
          us with personal information, please contact us and we will delete it.
        </p>
      </Section>

      <Section title="7. Changes to This Policy">
        <p>
          We may update this privacy policy from time to time. We will notify users of
          significant changes by updating the date at the top of this page. Continued use
          of SpendHalo after changes constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          If you have questions about this privacy policy or your data, contact us at:{" "}
          <a href="mailto:hello@spendhalo.app" className="text-primary underline underline-offset-2">
            hello@spendhalo.app
          </a>
        </p>
      </Section>

      <p className="text-xs text-muted-foreground pt-4 border-t border-border">
        © 2026 SpendHalo. All rights reserved.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
