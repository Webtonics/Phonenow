import { StaticPageLayout } from '@/components/layout/StaticPageLayout';

export const RefundPolicyPage = () => {
  return (
    <StaticPageLayout title="Refund Policy" lastUpdated="February 1, 2025">
      <p>
        At TonicsTools, we stand behind our service with a straightforward refund policy. Your satisfaction and trust are our top priorities.
      </p>

      <h2>1. SMS Verification Refunds</h2>
      <h3>Automatic Refunds</h3>
      <p>
        If you purchase a temporary phone number and do not receive an SMS verification code within the validity period (typically 20 minutes), you are entitled to a full refund. Here's how it works:
      </p>
      <ul>
        <li><strong>Self-Service Cancellation:</strong> You can cancel your order at any time before the validity period expires directly from your dashboard. The full purchase amount is refunded to your wallet instantly.</li>
        <li><strong>Automatic Expiry:</strong> If the validity period expires without an SMS being received, the order is automatically cancelled and the funds are returned to your wallet.</li>
        <li><strong>No Questions Asked:</strong> We do not require any explanation for cancellations. If the number didn't work, you get your money back — it's that simple.</li>
      </ul>

      <h3>When Refunds Are Not Available</h3>
      <p>Refunds for SMS verification orders are not available in the following cases:</p>
      <ul>
        <li>The SMS was successfully received and displayed on your dashboard</li>
        <li>The order validity period has expired and the SMS was delivered during the active period</li>
        <li>The account has been flagged for abuse or violation of our Terms of Service</li>
      </ul>

      <h2>2. eSIM Refunds</h2>
      <p>
        eSIM purchases are handled differently due to the nature of digital data plans:
      </p>
      <ul>
        <li><strong>Before Activation:</strong> If you have purchased an eSIM but have not yet activated it (i.e., the QR code has not been scanned or installed), you may request a refund within 24 hours of purchase</li>
        <li><strong>After Activation:</strong> Once an eSIM has been activated (QR code scanned/installed on your device), it is considered used and is not eligible for a refund</li>
        <li><strong>Technical Issues:</strong> If you experience technical issues preventing activation, contact our support team. We will work with you to resolve the issue or provide a replacement</li>
      </ul>

      <h2>3. Wallet Deposits</h2>
      <p>
        Wallet deposits are generally non-refundable as they are converted to platform credits. However:
      </p>
      <ul>
        <li><strong>Duplicate Charges:</strong> If you are charged more than once for the same deposit, we will refund the duplicate amount to your original payment method</li>
        <li><strong>Failed Credit:</strong> If a payment was deducted but your wallet was not credited, contact support with your payment receipt. We will credit your wallet or refund the payment</li>
        <li><strong>Account Closure:</strong> If you wish to close your account and have remaining wallet balance, you may request a withdrawal. A processing fee may apply, and the minimum withdrawal amount is ₦5,000</li>
      </ul>

      <h2>4. How to Request a Refund</h2>
      <ol>
        <li><strong>SMS Orders:</strong> Go to your dashboard, find the order, and click "Cancel" to receive an instant wallet refund</li>
        <li><strong>eSIM Issues:</strong> Email us at <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a> with your order details and a description of the issue</li>
        <li><strong>Billing Issues:</strong> Email us at <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a> with your account email, transaction reference, and payment receipt</li>
      </ol>

      <h2>5. Refund Processing Time</h2>
      <ul>
        <li><strong>Wallet Refunds:</strong> Instant — your wallet balance is updated immediately</li>
        <li><strong>Payment Method Refunds:</strong> 5-10 business days depending on your bank or payment provider</li>
        <li><strong>Cryptocurrency Refunds:</strong> Not available. Crypto payments are refunded to your wallet balance only</li>
      </ul>

      <h2>6. Abuse Prevention</h2>
      <p>
        We reserve the right to limit or deny refunds if we detect patterns of abuse, including but not limited to:
      </p>
      <ul>
        <li>Repeatedly purchasing and cancelling orders without genuine use</li>
        <li>Using the service to test whether numbers work before committing</li>
        <li>Any fraudulent activity or manipulation of our refund system</li>
      </ul>

      <h2>7. Contact Us</h2>
      <p>
        If you have any questions about our Refund Policy or need assistance with a refund, please contact us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a>.
      </p>
    </StaticPageLayout>
  );
};
