import { StaticPageLayout } from '@/components/layout/StaticPageLayout';

export const AcceptableUsePolicyPage = () => {
  return (
    <StaticPageLayout title="Acceptable Use Policy" lastUpdated="February 1, 2025">
      <p>
        This Acceptable Use Policy ("AUP") outlines the rules and guidelines for using TonicsTools. By using our platform, you agree to comply with this policy. Violations may result in account suspension or termination.
      </p>

      <h2>1. Permitted Use</h2>
      <p>
        TonicsTools is designed for legitimate purposes, including but not limited to:
      </p>
      <ul>
        <li>Verifying personal or business accounts on online platforms</li>
        <li>Testing and development of software applications that require SMS verification</li>
        <li>Protecting personal privacy by using temporary numbers instead of personal phone numbers</li>
        <li>Accessing mobile data while traveling via eSIM plans</li>
        <li>Managing multiple accounts for legitimate business or personal purposes</li>
      </ul>

      <h2>2. Prohibited Activities</h2>
      <p>
        You must not use TonicsTools for any of the following activities:
      </p>

      <h3>2.1 Illegal Activities</h3>
      <ul>
        <li>Any activity that violates local, national, or international laws</li>
        <li>Identity theft, fraud, or impersonation</li>
        <li>Money laundering or financing of illegal activities</li>
        <li>Creating accounts for the purpose of conducting illegal transactions</li>
      </ul>

      <h3>2.2 Spam and Abuse</h3>
      <ul>
        <li>Sending unsolicited messages, spam, or bulk communications</li>
        <li>Creating fake accounts on third-party platforms for spamming purposes</li>
        <li>Automated bulk purchasing of phone numbers without legitimate use</li>
        <li>Using our service to facilitate phishing attacks or scams</li>
      </ul>

      <h3>2.3 Harassment and Harm</h3>
      <ul>
        <li>Harassing, threatening, stalking, or intimidating others</li>
        <li>Creating accounts to bypass bans or restrictions imposed on you by other platforms</li>
        <li>Any activity intended to cause harm to individuals or organizations</li>
      </ul>

      <h3>2.4 Platform Abuse</h3>
      <ul>
        <li>Attempting to hack, exploit, or circumvent our platform's security</li>
        <li>Reverse-engineering, decompiling, or disassembling our software</li>
        <li>Using bots, scripts, or automated tools to interact with our platform without authorization</li>
        <li>Interfering with the operation of our service or other users' experience</li>
        <li>Manipulating the referral system to generate fraudulent commissions</li>
      </ul>

      <h3>2.5 Reselling</h3>
      <ul>
        <li>Reselling our services without prior written authorization</li>
        <li>Acting as an intermediary or broker for our services without agreement</li>
      </ul>

      <h2>3. Fair Usage</h2>
      <p>
        To maintain service quality for all users, we enforce fair usage limits:
      </p>
      <ul>
        <li>Excessive cancellation of orders (repeatedly buying and cancelling without using the service) may result in account review</li>
        <li>Unusually high volumes of purchases in a short timeframe may trigger a temporary hold for fraud review</li>
        <li>We may contact you to verify your identity or intentions if unusual activity is detected</li>
      </ul>

      <h2>4. Reporting Violations</h2>
      <p>
        If you become aware of any misuse of our platform, please report it to us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a>. We take all reports seriously and investigate promptly.
      </p>

      <h2>5. Consequences of Violation</h2>
      <p>
        If we determine that you have violated this Acceptable Use Policy, we may take one or more of the following actions at our sole discretion:
      </p>
      <ul>
        <li>Issue a warning to your account</li>
        <li>Temporarily suspend your account</li>
        <li>Permanently terminate your account</li>
        <li>Forfeit any remaining wallet balance</li>
        <li>Report the violation to relevant law enforcement authorities</li>
        <li>Pursue legal action to recover damages</li>
      </ul>

      <h2>6. Changes to This Policy</h2>
      <p>
        We may update this Acceptable Use Policy at any time. Changes will be posted on this page with an updated date. Continued use of our platform after changes are posted constitutes acceptance of the updated policy.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have questions about this Acceptable Use Policy, please contact us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a>.
      </p>
    </StaticPageLayout>
  );
};
