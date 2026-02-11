import { StaticPageLayout } from '@/components/layout/StaticPageLayout';

export const AboutPage = () => {
  return (
    <StaticPageLayout title="About Us">
      <p>
        TonicsTools is Nigeria's leading platform for online SMS verification and eSIM data plans. We make it simple, fast, and affordable to get verified on any platform — without sharing your personal phone number.
      </p>

      <h2>Our Mission</h2>
      <p>
        We believe everyone deserves access to reliable digital tools. Our mission is to empower individuals and businesses across Africa with seamless verification and connectivity solutions — at prices that make sense.
      </p>

      <h2>What We Do</h2>
      <p>
        TonicsTools provides two core services designed to keep you connected and verified:
      </p>
      <ul>
        <li><strong>SMS Verification:</strong> Instant access to temporary phone numbers from 100+ countries. Verify accounts on WhatsApp, Telegram, Google, Facebook, and 500+ other services — quickly and securely.</li>
        <li><strong>eSIM Data Plans:</strong> Stay connected wherever you travel with affordable eSIM data plans. No physical SIM swapping required — activate your plan in minutes directly from your device.</li>
      </ul>

      <h2>Why Choose TonicsTools?</h2>
      <ul>
        <li><strong>Built for Nigerians:</strong> Pay in Naira with local payment methods. No foreign cards or currency conversions needed.</li>
        <li><strong>Instant Delivery:</strong> Get your verification codes in seconds, not minutes. Our infrastructure is optimized for speed.</li>
        <li><strong>Money-Back Guarantee:</strong> Didn't receive your SMS code? Get a full, automatic refund to your wallet — no questions asked.</li>
        <li><strong>Affordable Pricing:</strong> Competitive rates with no hidden fees. Top up your wallet and pay only for what you use.</li>
        <li><strong>Secure & Private:</strong> Your data stays private. We don't store SMS content after order completion, and all transactions are encrypted.</li>
        <li><strong>24/7 Support:</strong> Our support team is always available to help you with any questions or issues.</li>
      </ul>

      <h2>Our Story</h2>
      <p>
        TonicsTools was born from a simple frustration: getting verified on global platforms from Nigeria was expensive, unreliable, and complicated. We set out to build a service that just works — fast numbers, real codes, fair prices, and instant refunds when things don't go as planned.
      </p>
      <p>
        Since launch, we've served thousands of satisfied customers across Nigeria and beyond, processing hundreds of thousands of verifications. We continue to grow our network of phone numbers and expand our eSIM coverage to serve you better.
      </p>

      <h2>Get in Touch</h2>
      <p>
        Have questions, feedback, or a business inquiry? We'd love to hear from you. Reach out at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a> or visit our{' '}
        <a href="/contact">Contact page</a>.
      </p>
    </StaticPageLayout>
  );
};
