import { Mail, MessageSquare, Clock, MapPin } from 'lucide-react';
import { StaticPageLayout } from '@/components/layout/StaticPageLayout';

export const ContactPage = () => {
  return (
    <StaticPageLayout title="Contact & Support">
      <p>
        We're here to help! Whether you have a question about our SMS verification service, eSIM plans, billing, or anything else — our team is ready to assist you.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 my-8 not-prose">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary-100)' }}
          >
            <Mail className="w-6 h-6" style={{ color: 'var(--color-primary-600)' }} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
          <p className="text-gray-600 text-sm mb-3">For general inquiries and account issues</p>
          <a href="mailto:hello@tonicstools.com" className="text-sm font-medium" style={{ color: 'var(--color-primary-600)' }}>
            hello@tonicstools.com
          </a>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-accent-100)' }}
          >
            <MessageSquare className="w-6 h-6" style={{ color: 'var(--color-accent-600)' }} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
          <p className="text-gray-600 text-sm mb-3">Quick answers from our support team</p>
          <p className="text-sm font-medium text-gray-700">Available on your dashboard</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-success-100)' }}
          >
            <Clock className="w-6 h-6" style={{ color: 'var(--color-success-600)' }} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Support Hours</h3>
          <p className="text-gray-600 text-sm mb-3">We aim to respond as quickly as possible</p>
          <p className="text-sm font-medium text-gray-700">24/7 — including weekends & holidays</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-info-100)' }}
          >
            <MapPin className="w-6 h-6" style={{ color: 'var(--color-info-600)' }} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
          <p className="text-gray-600 text-sm mb-3">Where we operate</p>
          <p className="text-sm font-medium text-gray-700">Lagos, Nigeria</p>
        </div>
      </div>

      <h2>Frequently Asked Questions</h2>
      <p>
        Before reaching out, you might find your answer in our <a href="/#faq">FAQ section</a> on the home page. We cover topics like how the service works, payment methods, refund process, and more.
      </p>

      <h2>Billing & Refund Issues</h2>
      <p>
        If you have a billing concern or need a refund, our system handles most refunds automatically. If you didn't receive your SMS code, simply cancel the order from your dashboard and the funds will be returned to your wallet instantly.
      </p>
      <p>
        For other billing issues, please email us with your account email address and order details, and we'll resolve it promptly.
      </p>

      <h2>Business Inquiries</h2>
      <p>
        For enterprise solutions, partnership opportunities, or bulk pricing, please email us at{' '}
        <a href="mailto:hello@tonicstools.com">hello@tonicstools.com</a> with the subject line "Business Inquiry" and a brief description of your needs.
      </p>

      <h2>Report a Problem</h2>
      <p>
        If you encounter a bug, security vulnerability, or any issue with our platform, please let us know immediately. We take all reports seriously and work to resolve them as fast as possible.
      </p>
    </StaticPageLayout>
  );
};
