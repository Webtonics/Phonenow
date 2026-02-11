/**
 * Brand Configuration
 *
 * Change these values to rebrand the entire application.
 * All brand-specific text, images, and metadata are centralized here.
 */

export const brand = {
  // Core
  name: import.meta.env.VITE_APP_NAME || 'TonicsTools',
  tagline: 'SMS Verification & eSIM',
  domain: 'tonicstools.com',

  // Images
  logo: '/tonicstools_logo.png',
  favicon: '/tonicstools_favicon.png',

  // SEO
  meta: {
    title: 'TonicsTools - SMS Verification & eSIM',
    description: 'High Quality Online SMS Verification Service. Get temporary phone numbers from 100+ countries. eSIM data plans for travelers.',
  },

  // Contact & Social
  supportEmail: 'hello@tonicstools.com',
  social: {
    twitter: '#',
    telegram: '#',
  },

  // Landing page content
  landing: {
    hero: {
      badge: '#1 SMS Verification in Nigeria',
      title: 'Get Verified Instantly',
      titleHighlight: 'with Real Phone Numbers',
      subtitle: 'Access temporary phone numbers from 100+ countries for SMS verification. Fast, reliable, and affordable — built for Nigerians.',
    },
    stats: {
      countries: '100+',
      services: '500+',
      users: '10,000+',
      uptime: '99.9%',
    },
    targetAudience: 'Nigeria', // Used in copy like "built for Nigerians"
  },

  // Wallet / Payment
  wallet: {
    currency: '₦',
    currencyCode: 'NGN',
    minDeposit: 2000,
    maxDeposit: 1000000,
    quickAmounts: [2000, 5000, 10000, 20000, 50000, 100000],
  },

  // Testimonials — swap these out per brand
  testimonials: [
    {
      name: 'Adebayo O.',
      initials: 'AO',
      role: 'Social Media Manager, Lagos',
      text: 'TonicsTools saved me so much time and stress. I needed to verify multiple accounts for my social media business and this service delivered every single time. The refund guarantee gave me confidence to try it.',
      color: 'primary',
    },
    {
      name: 'Chidi E.',
      initials: 'CE',
      role: 'Software Developer, Abuja',
      text: "As a developer, I need to test SMS verification constantly. TonicsTools gives me numbers from multiple countries instantly. The cheapest and most reliable service I've used in Nigeria.",
      color: 'accent',
    },
    {
      name: 'Fatima N.',
      initials: 'FN',
      role: 'Digital Marketer, Port Harcourt',
      text: "The speed is incredible — I get my codes in seconds. And when one number didn't work, I got my refund immediately. I've recommended TonicsTools to all my colleagues.",
      color: 'success',
    },
    {
      name: 'Oluwaseun K.',
      initials: 'OK',
      role: 'E-Commerce Owner, Ibadan',
      text: 'I run an e-commerce business and needed to verify accounts across different platforms. TonicsTools made it simple. The wallet system is convenient and I love paying in Naira.',
      color: 'info',
    },
    {
      name: 'Blessing A.',
      initials: 'BA',
      role: 'Content Creator, Benin City',
      text: "I've tried other OTP services but TonicsTools is by far the best. Great prices, fast delivery, and the interface is so easy to use. It just works.",
      color: 'warning',
    },
  ],
} as const;
