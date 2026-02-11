import { StaticPageLayout } from '@/components/layout/StaticPageLayout';

export const PrivacyPolicyPage = () => {
  return (
    <StaticPageLayout title="Privacy Policy" lastUpdated="February 1, 2025">
      <p>
        At TonicsTools, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Account Information</h3>
      <p>When you register for an account, we collect:</p>
      <ul>
        <li>Your name and email address</li>
        <li>Password (stored in encrypted form)</li>
        <li>Phone number (optional)</li>
      </ul>

      <h3>1.2 Transaction Information</h3>
      <p>When you use our services, we collect:</p>
      <ul>
        <li>Wallet funding and transaction history</li>
        <li>Phone number purchases and SMS verification records</li>
        <li>eSIM purchase and activation records</li>
        <li>Payment method details (processed securely by our payment providers)</li>
      </ul>

      <h3>1.3 Technical Information</h3>
      <p>We automatically collect certain technical information, including:</p>
      <ul>
        <li>IP address and approximate location</li>
        <li>Browser type, version, and operating system</li>
        <li>Device information</li>
        <li>Pages visited and actions taken on our platform</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and manage your wallet</li>
        <li>Send you important account notifications and updates</li>
        <li>Respond to your support requests and inquiries</li>
        <li>Detect and prevent fraud, abuse, and security threats</li>
        <li>Comply with legal obligations</li>
        <li>Analyze usage patterns to improve our platform</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>We do not sell your personal information to third parties. We may share your information only in the following circumstances:</p>
      <ul>
        <li><strong>Payment Processors:</strong> We share necessary payment details with our payment providers (e.g., Paystack, Flutterwave) to process transactions</li>
        <li><strong>Service Providers:</strong> We may share data with trusted service providers who assist us in operating our platform, subject to confidentiality agreements</li>
        <li><strong>Legal Requirements:</strong> We may disclose information if required by law, legal process, or government request</li>
        <li><strong>Protection of Rights:</strong> We may share information to protect the rights, property, or safety of TonicsTools, our users, or the public</li>
      </ul>

      <h2>4. SMS Verification Data</h2>
      <p>
        We want to be transparent about how we handle SMS verification data:
      </p>
      <ul>
        <li>Temporary phone numbers are assigned to you for a limited time (typically 20 minutes)</li>
        <li>SMS messages received on your temporary number are displayed only to you</li>
        <li>After the number expires or the order is cancelled, the association between you and the number is removed</li>
        <li>We do not store the content of received SMS messages after order completion</li>
      </ul>

      <h2>5. Data Security</h2>
      <p>
        We implement industry-standard security measures to protect your data, including:
      </p>
      <ul>
        <li>Encryption of data in transit (TLS/SSL) and at rest</li>
        <li>Secure password hashing</li>
        <li>Regular security audits and monitoring</li>
        <li>Access controls limiting employee access to personal data</li>
        <li>Secure API authentication using tokens</li>
      </ul>
      <p>
        While we take reasonable precautions to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security of your data.
      </p>

      <h2>6. Cookies</h2>
      <p>We use cookies and similar technologies to:</p>
      <ul>
        <li>Keep you logged in to your account</li>
        <li>Remember your preferences</li>
        <li>Understand how you use our platform</li>
        <li>Improve your experience</li>
      </ul>
      <p>
        You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our platform.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We retain your personal information for as long as your account is active or as needed to provide you with our services. If you close your account, we will delete or anonymize your personal data within 90 days, except where we are required to retain it for legal or regulatory purposes.
      </p>
      <p>
        Transaction records may be retained for up to 7 years for accounting and compliance purposes.
      </p>

      <h2>8. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
        <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal obligations)</li>
        <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
        <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
      </ul>
      <p>
        To exercise any of these rights, please contact us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a>.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 18, we will take steps to delete that information promptly.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a>.
      </p>
    </StaticPageLayout>
  );
};
