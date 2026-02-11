import { StaticPageLayout } from '@/components/layout/StaticPageLayout';

export const TermsOfServicePage = () => {
  return (
    <StaticPageLayout title="Terms of Service" lastUpdated="February 1, 2025">
      <p>
        Welcome to TonicsTools. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account, accessing, or using TonicsTools (the "Service"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        TonicsTools provides temporary phone numbers for SMS verification and eSIM data plans. Our services include:
      </p>
      <ul>
        <li>Temporary phone numbers from 100+ countries for receiving SMS verification codes</li>
        <li>eSIM data plans for mobile connectivity in supported countries</li>
        <li>A digital wallet system for managing payments and credits</li>
        <li>A referral program for earning commissions</li>
      </ul>

      <h2>3. Account Registration</h2>
      <p>
        To use the Service, you must create an account by providing accurate and complete information. You are responsible for:
      </p>
      <ul>
        <li>Maintaining the confidentiality of your account credentials</li>
        <li>All activities that occur under your account</li>
        <li>Notifying us immediately of any unauthorized use of your account</li>
        <li>Ensuring your account information remains accurate and up to date</li>
      </ul>
      <p>
        You must be at least 18 years old to create an account and use the Service.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>
        You agree to use the Service only for lawful purposes. You must not use TonicsTools to:
      </p>
      <ul>
        <li>Engage in any fraudulent, illegal, or unauthorized activities</li>
        <li>Violate the terms of service of any third-party platform</li>
        <li>Send spam, phishing messages, or any unsolicited communications</li>
        <li>Harass, threaten, or harm other individuals</li>
        <li>Attempt to circumvent platform limitations or security measures</li>
        <li>Resell or redistribute our services without authorization</li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that violate these terms without prior notice.
      </p>

      <h2>5. Payments and Wallet</h2>
      <p>
        All payments are processed through our wallet system. By funding your wallet, you agree to the following:
      </p>
      <ul>
        <li>All wallet deposits are final and credited in Nigerian Naira (NGN)</li>
        <li>Wallet funds are used exclusively for purchasing services on our platform</li>
        <li>We accept payments via card, bank transfer, USSD, and cryptocurrency</li>
        <li>You are responsible for ensuring you have sufficient wallet balance before making a purchase</li>
      </ul>

      <h2>6. Refunds</h2>
      <p>
        We offer refunds under specific conditions as outlined in our <a href="/refund-policy">Refund Policy</a>. In general:
      </p>
      <ul>
        <li>If you do not receive an SMS within the validity period, you may cancel the order for a full wallet refund</li>
        <li>Refunds are credited to your wallet balance, not to your original payment method</li>
        <li>Wallet balance refunds to your bank account or payment method may be available upon request, subject to a processing fee</li>
      </ul>

      <h2>7. Service Availability</h2>
      <p>
        While we strive for 99.9% uptime, we do not guarantee uninterrupted or error-free service. Phone number availability, SMS delivery rates, and eSIM activation may vary depending on factors outside our control, including third-party provider availability and country-specific regulations.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        All content, trademarks, logos, and intellectual property on the TonicsTools platform are owned by or licensed to us. You may not copy, modify, distribute, or reproduce any part of our platform without prior written consent.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, TonicsTools shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising from your use of or inability to use the Service.
      </p>
      <p>
        Our total liability for any claim arising from the Service shall not exceed the amount you paid to us in the 30 days preceding the claim.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless TonicsTools, its officers, employees, and agents from any claims, damages, losses, or expenses arising out of your use of the Service or violation of these Terms.
      </p>

      <h2>11. Modifications to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
      </p>

      <h2>12. Termination</h2>
      <p>
        We may suspend or terminate your account at our discretion if we believe you have violated these Terms. Upon termination, your right to use the Service ceases immediately. Any remaining wallet balance may be forfeited if the termination is due to a violation of these Terms.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Lagos, Nigeria.
      </p>

      <h2>14. Contact Us</h2>
      <p>
        If you have questions about these Terms of Service, please contact us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a>.
      </p>
    </StaticPageLayout>
  );
};
