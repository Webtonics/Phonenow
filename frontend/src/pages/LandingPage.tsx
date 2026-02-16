import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  CheckCircle,
  Zap,
  Shield,
  ArrowRight,
  Globe,
  RefreshCcw,
  Clock,
  Users,
  Building2,
  Code2,
  ChevronDown,
  ChevronUp,
  Wifi,
  Star,
  MessageSquare,
  Lock,
  CreditCard,
  Headphones,
  Menu,
  X,
  TrendingUp,
  Award,
  ShieldCheck,
  Smartphone,
  MapPin,
  ThumbsUp,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { ServiceIcon } from '@/components/icons';

// Services for trust bar
const services = [
  'WhatsApp',
  'Telegram',
  'Instagram',
  'Google',
  'Facebook',
  'Twitter',
  'TikTok',
  'Discord',
  'Netflix',
  'Amazon',
];

// Service categories
const serviceCategories = [
  {
    title: 'Social Media',
    description: 'Verify accounts on all major social platforms without using your personal number.',
    services: ['Instagram', 'Facebook', 'Twitter', 'TikTok', 'Snapchat', 'LinkedIn'],
    icon: Users,
    color: 'primary',
  },
  {
    title: 'Messaging Apps',
    description: 'Get verified on messaging platforms instantly with temporary numbers.',
    services: ['WhatsApp', 'Telegram', 'Signal', 'Viber', 'WeChat', 'LINE'],
    icon: MessageSquare,
    color: 'accent',
  },
  {
    title: 'Email & Cloud',
    description: 'Create and verify email accounts and cloud services with SMS verification.',
    services: ['Google', 'Microsoft', 'Yahoo', 'iCloud', 'Dropbox', 'ProtonMail'],
    icon: Globe,
    color: 'success',
  },
  {
    title: 'E-Commerce & Finance',
    description: 'Verify your accounts on shopping platforms and financial services securely.',
    services: ['Amazon', 'PayPal', 'Payoneer', 'Binance', 'eBay', 'Wise'],
    icon: CreditCard,
    color: 'info',
  },
];

// Platform services for SMM section
const smmPlatforms = [
  { name: 'Instagram', items: ['Followers', 'Likes', 'Views', 'Comments'] },
  { name: 'TikTok', items: ['Followers', 'Likes', 'Views', 'Shares'] },
  { name: 'YouTube', items: ['Subscribers', 'Views', 'Likes', 'Watch Hours'] },
  { name: 'Facebook', items: ['Page Likes', 'Followers', 'Post Likes', 'Views'] },
  { name: 'Twitter', items: ['Followers', 'Likes', 'Retweets', 'Views'] },
  { name: 'Telegram', items: ['Members', 'Post Views', 'Reactions', 'Comments'] },
];

// FAQ data
const faqs = [
  {
    question: 'How does the phone verification service work?',
    answer: 'Simply select a country and service, purchase a temporary phone number, and receive your SMS verification code within seconds. The number is valid for 20 minutes, giving you plenty of time to complete your verification.',
  },
  {
    question: 'What happens if I don\'t receive an SMS?',
    answer: 'We offer a 100% money-back guarantee. If you don\'t receive an SMS within the validity period, you can cancel the order and receive a full refund to your wallet instantly. No questions asked.',
  },
  {
    question: 'Which countries and services are supported?',
    answer: 'We support 100+ countries including USA, UK, Russia, Nigeria, India, and many more. Our platform works with 500+ services including WhatsApp, Telegram, Google, Facebook, Instagram, TikTok, and virtually any platform that requires SMS verification.',
  },
  {
    question: 'How do I fund my wallet?',
    answer: 'We accept multiple payment methods including card payments (Visa, Mastercard, Verve), bank transfers, cryptocurrency (Bitcoin, USDT, Ethereum), and USSD. Simply choose your preferred method, enter the amount, and your wallet is instantly credited.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption to protect your data. Phone numbers are temporary and discarded after use. We never store your verification codes or share your information with third parties.',
  },
  {
    question: 'Can I use this for business purposes?',
    answer: 'Yes! Many businesses use our service for testing, development, and legitimate verification needs. We offer competitive rates for high-volume users. Contact us for enterprise solutions.',
  },
  {
    question: 'What is eSIM and how does it work?',
    answer: 'eSIM is a digital SIM that lets you activate a mobile data plan without a physical SIM card. Simply purchase an eSIM plan for your destination country, scan the QR code with your phone, and enjoy instant mobile data. Perfect for international travel.',
  },
  {
    question: 'What are SMM services?',
    answer: 'SMM (Social Media Marketing) services help you grow your social media presence by increasing followers, likes, views, comments, and engagement on platforms like Instagram, TikTok, YouTube, Facebook, Twitter, and Telegram. Simply choose a service, enter your profile link, and watch your numbers grow.',
  },
  {
    question: 'Are the SMM followers and likes real?',
    answer: 'We work with premium providers to deliver high-quality engagement. Results vary by service — some offer real, active users while others provide high-retention accounts. Each service description clearly states what to expect. Many services also include refill guarantees if numbers drop.',
  },
  {
    question: 'Do you offer VPN services?',
    answer: 'Yes! We offer premium VPN plans you can purchase directly from your dashboard and pay in Naira. Browse securely with servers in 50+ countries, enjoy zero-log privacy, and protect all your devices — phone, laptop, and tablet.',
  },
  {
    question: 'How fast will I receive my verification code?',
    answer: 'Most verification codes arrive within 1-5 seconds after the platform sends them. Our system automatically detects incoming SMS and displays the code on your dashboard in real-time. You\'ll see it appear instantly.',
  },
  {
    question: 'Do you offer a referral program?',
    answer: 'Yes! Share your referral link with friends and earn a commission on every purchase they make. Both you and your referred friend receive bonus credits when they sign up. Check the Referrals section in your dashboard for details.',
  },
];

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-8 sm:h-9 md:h-10" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Services
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                How It Works
              </a>
              <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#services" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  Services
                </a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#faq" className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </a>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Link to="/login" className="flex-1 text-center text-sm font-medium text-gray-600 py-2.5 border border-gray-200 rounded-lg">
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center text-sm font-medium text-white py-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary-500)' }}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-24 sm:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl translate-y-1/2"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-success-200/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-medium">A</div>
                <div className="w-6 h-6 rounded-full bg-accent-400 flex items-center justify-center text-white text-xs font-medium">B</div>
                <div className="w-6 h-6 rounded-full bg-success-400 flex items-center justify-center text-white text-xs font-medium">C</div>
              </div>
              <span className="text-sm text-gray-600">
                Trusted by <span className="font-semibold text-gray-900">10,000+</span> users across Nigeria
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-accent-400 text-accent-400" />
                ))}
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Your All-in-One
              <span className="block mt-2" style={{ color: 'var(--color-primary-500)' }}>
                Digital Services Hub
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              <span className="font-semibold text-gray-900">SMS verification</span> from 100+ countries.
              {' '}<span className="font-semibold text-gray-900">Social media growth</span> for Instagram, TikTok, YouTube & more.
              {' '}<span className="font-semibold text-gray-900">eSIM data</span> & <span className="font-semibold text-gray-900">VPN</span> for global connectivity.
              {' '}All in one platform, all in Naira.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg text-lg"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-all text-lg"
                style={{ color: 'var(--color-text-primary)' }}
              >
                See How It Works
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>100% money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>Instant delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>24/7 availability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar - Supported Services */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-medium">
            Works with all major platforms
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {services.map((service) => (
              <div
                key={service}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ServiceIcon service={service} size={24} colored />
                <span className="font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}
            >
              Why TonicsTools
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Everything you need to
              <span style={{ color: 'var(--color-primary-500)' }}> grow online</span>
            </h2>
            <p className="text-lg text-gray-600">
              From phone verification to social media growth and global connectivity — here's why thousands of users choose TonicsTools every day.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-success-100)' }}
              >
                <RefreshCcw className="w-7 h-7" style={{ color: 'var(--color-success-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                100% Refund Guarantee
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Didn't receive your SMS? Get a full refund instantly to your wallet. No questions asked, no hassle. Your money is always protected.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-accent-100)' }}
              >
                <Zap className="w-7 h-7" style={{ color: 'var(--color-accent-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Lightning Fast Delivery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get your verification code in 1-5 seconds. Our system automatically fetches SMS the moment it arrives. No delays, no waiting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Globe className="w-7 h-7" style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                100+ Countries Available
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Access phone numbers from USA, UK, Russia, India, Nigeria, Canada, Germany, and 100+ more countries worldwide.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-info-100)' }}
              >
                <CreditCard className="w-7 h-7" style={{ color: 'var(--color-info-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Cheapest Prices in Nigeria
              </h3>
              <p className="text-gray-600 leading-relaxed">
                The most competitive rates you'll find anywhere. Pay in Naira with no hidden fees. Numbers start from as low as ₦50.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-warning-100)' }}
              >
                <Lock className="w-7 h-7" style={{ color: 'var(--color-warning-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Privacy Protected
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Keep your personal phone number private. Temporary numbers are discarded after use. No spam, no data leaks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--color-error-100)' }}
              >
                <Headphones className="w-7 h-7" style={{ color: 'var(--color-error-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                24/7 Support
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our dedicated support team is always available to help you with any issues. Get help via live chat or email anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }}
            >

              SMS Verification
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Verify on <span style={{ color: 'var(--color-primary-500)' }}>any platform</span>
            </h2>
            <p className="text-lg text-gray-600">
              Get temporary phone numbers from 100+ countries. Works with every service that requires SMS verification — from social media to banking.
            </p>
          </div>

          {/* Categories grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {serviceCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.title}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `var(--color-${category.color}-100)` }}
                    >
                      <IconComponent className="w-7 h-7" style={{ color: `var(--color-${category.color}-600)` }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        {category.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{category.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {category.services.map((service) => (
                          <span
                            key={service}
                            className="px-3 py-1 text-sm rounded-full bg-white border border-gray-200 text-gray-600"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* More services note */}
          <div className="text-center mt-10">
            <p className="text-gray-500">
              ...and <span className="font-semibold text-gray-700">500+ more services</span> including dating apps, gaming platforms, ride-sharing, delivery services, and more.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}
            >
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Get verified in <span style={{ color: 'var(--color-primary-500)' }}>3 easy steps</span>
            </h2>
            <p className="text-lg text-gray-600">
              No complicated setup. No technical knowledge needed. Pick a service and get results in seconds.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                1
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Choose Your Number
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Select a country and the service you want to verify (e.g. WhatsApp, Google). Browse available numbers and pricing, then pick one.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                2
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Use the Number
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Enter the phone number on the platform you're verifying. Request the SMS verification code as you normally would.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                3
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Get Your Code
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your SMS code appears on your dashboard in seconds. Copy the code, complete your verification, and you're done!
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-14">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all hover:opacity-90 shadow-lg text-lg"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              Try It Now — It's Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-gray-500 mt-3">Create your account in 30 seconds</p>
          </div>
        </div>
      </section>

      {/* Money-Back Guarantee Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-success-50 to-white rounded-3xl p-8 md:p-12 shadow-lg border border-success-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--color-success-100)' }}
                >
                  <Shield className="w-10 h-10" style={{ color: 'var(--color-success-600)' }} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Zero Risk. 100% Money-Back Guarantee.
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  We're so confident in our service that we guarantee a full refund if you don't receive your SMS code.
                  If the number doesn't work, simply cancel and your wallet balance is restored instantly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>Instant automatic refund to your wallet</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>No questions asked — cancel anytime within validity</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>No hidden fees or surprise charges</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>Try another number if the first one doesn't work</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-success-100 to-primary-100 rounded-2xl p-8 text-center">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-success-600)' }} />
                  <div className="text-5xl font-bold mb-2" style={{ color: 'var(--color-success-700)' }}>
                    100%
                  </div>
                  <div className="text-xl font-semibold text-gray-700 mb-4">
                    Money Protected
                  </div>
                  <p className="text-gray-600">
                    Every single transaction is covered by our refund guarantee. Your money is always safe with us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-info-100)', color: 'var(--color-info-700)' }}
            >
              Use Cases
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Built for <span style={{ color: 'var(--color-primary-500)' }}>everyone who needs verification</span>
            </h2>
            <p className="text-lg text-gray-600">
              Whether you're an influencer, developer, business, or everyday user — TonicsTools has you covered.
            </p>
          </div>

          {/* Use case cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Influencers & Marketers */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-accent-100)' }}
              >
                <TrendingUp className="w-7 h-7" style={{ color: 'var(--color-accent-600)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Influencers & Marketers
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Grow your audience with SMM services and manage multiple accounts with phone verification.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  Boost followers & engagement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  Multi-account verification
                </li>
              </ul>
            </div>

            {/* Developers */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Code2 className="w-7 h-7" style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Developers & Testers
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Test SMS flows in your applications without managing real SIM cards.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  Test auth flows
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  QA multiple accounts
                </li>
              </ul>
            </div>

            {/* Privacy Seekers */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-success-100)' }}
              >
                <Lock className="w-7 h-7" style={{ color: 'var(--color-success-600)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Privacy-Conscious Users
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Protect your personal number from spam and unwanted contacts.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  No spam on your number
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  Complete privacy
                </li>
              </ul>
            </div>

            {/* Businesses */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-info-100)' }}
              >
                <Building2 className="w-7 h-7" style={{ color: 'var(--color-info-600)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Businesses & Agencies
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Scale your operations with reliable, high-volume verification services.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  High volume support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  Competitive rates
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-sidebar)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trusted by thousands of users across Nigeria
            </h2>
            <p className="text-lg text-gray-400">
              Our numbers speak for themselves
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-primary-400)' }}>
                100+
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Countries Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-accent-400)' }}>
                5K+
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Services Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-success-400)' }}>
                10K+
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-info-400)' }}>
                4.9/5
              </div>
              <div className="text-gray-400 text-sm sm:text-base">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* SMM Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                  <TrendingUp className="w-4 h-4" />
                  Social Media Growth
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Boost Your Social Media Presence
                </h2>
                <p className="text-lg text-purple-100 max-w-2xl mx-auto leading-relaxed">
                  Get real followers, likes, views, and engagement across all major platforms.
                  Affordable prices, instant delivery, and reliable results to grow your online presence.
                </p>
              </div>

              {/* Platform grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {smmPlatforms.map((platform) => (
                  <div key={platform.name} className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <ServiceIcon service={platform.name} size={24} colored={false} className="text-white" />
                      <span className="font-semibold text-white">{platform.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {platform.items.map((item) => (
                        <span key={item} className="px-2 py-0.5 bg-white/15 rounded-full text-xs text-purple-100">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Features row */}
              <div className="flex flex-wrap justify-center gap-6 mb-10">
                <div className="flex items-center gap-2 text-purple-100">
                  <Zap className="w-5 h-5 text-white" />
                  <span>Instant Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-purple-100">
                  <Shield className="w-5 h-5 text-white" />
                  <span>Real Engagement</span>
                </div>
                <div className="flex items-center gap-2 text-purple-100">
                  <CreditCard className="w-5 h-5 text-white" />
                  <span>Pay in Naira</span>
                </div>
                <div className="flex items-center gap-2 text-purple-100">
                  <RefreshCcw className="w-5 h-5 text-white" />
                  <span>Refill Guarantee</span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all text-lg shadow-lg"
                >
                  Explore SMM Services
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* eSIM Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                  <Wifi className="w-4 h-4" />
                  Global Connectivity
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Stay Connected Anywhere with eSIM
                </h2>
                <p className="text-lg text-primary-100 mb-6 leading-relaxed">
                  Get instant mobile data in 100+ countries without physical SIM cards.
                  Perfect for travelers, remote workers, and digital nomads. Activate in seconds — no SIM swaps needed.
                </p>
                <ul className="space-y-2 mb-8">
                  <li className="flex items-center gap-3 text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Instant activation via QR code</span>
                  </li>
                  <li className="flex items-center gap-3 text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Data plans for 100+ countries</span>
                  </li>
                  <li className="flex items-center gap-3 text-primary-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Keep your main number active</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all"
                >
                  Explore eSIM Plans
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-10 text-center">
                  <Smartphone className="w-20 h-20 text-white mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white mb-1">Global eSIM</div>
                  <div className="text-primary-100 mb-4">Instant Activation</div>
                  <div className="flex items-center justify-center gap-2 text-sm text-primary-100">
                    <MapPin className="w-4 h-4" />
                    <span>100+ countries covered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VPN Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                  <Shield className="w-4 h-4" />
                  Online Privacy
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Browse Securely with Premium VPN
                </h2>
                <p className="text-lg text-emerald-100 mb-6 leading-relaxed">
                  Protect your privacy, bypass geo-restrictions, and browse the internet securely from anywhere in the world.
                  Fast servers, zero logs, and affordable plans — all purchasable in Naira.
                </p>
                <ul className="space-y-2 mb-8">
                  <li className="flex items-center gap-3 text-emerald-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Ultra-fast servers in 50+ countries</span>
                  </li>
                  <li className="flex items-center gap-3 text-emerald-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Zero-log privacy policy</span>
                  </li>
                  <li className="flex items-center gap-3 text-emerald-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Works on all devices — phone, laptop, tablet</span>
                  </li>
                  <li className="flex items-center gap-3 text-emerald-100">
                    <CheckCircle className="w-5 h-5 text-white shrink-0" />
                    <span>Unblock streaming, social media & more</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
                >
                  Explore VPN Plans
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-10 text-center">
                  <Shield className="w-20 h-20 text-white mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white mb-1">Premium VPN</div>
                  <div className="text-emerald-100 mb-4">Total Privacy. Pay in Naira.</div>
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-100">
                    <Lock className="w-4 h-4" />
                    <span>50+ server locations</span>
                  </div>
                  <div className="mt-4 text-xs text-emerald-200">Available now on your dashboard</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-page-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }}
            >
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              What our customers say
            </h2>
            <p className="text-lg text-gray-600">
              Don't just take our word for it — hear from real users
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "TonicsTools saved me so much time and stress. I needed to verify multiple accounts for my social media business and this service delivered every single time. The refund guarantee gave me confidence to try it."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                  AO
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Adebayo O.</div>
                  <div className="text-sm text-gray-500">Social Media Manager, Lagos</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "As a developer, I need to test SMS verification constantly. TonicsTools gives me numbers from multiple countries instantly. The cheapest and most reliable service I've used in Nigeria."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-semibold">
                  CE
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Chidi E.</div>
                  <div className="text-sm text-gray-500">Software Developer, Abuja</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "The speed is incredible — I get my codes in seconds. And when one number didn't work, I got my refund immediately. I've recommended TonicsTools to all my colleagues."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center text-success-600 font-semibold">
                  FN
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Fatima N.</div>
                  <div className="text-sm text-gray-500">Digital Marketer, Port Harcourt</div>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "I run an e-commerce business and needed to verify accounts across different platforms. TonicsTools made it simple. The wallet system is convenient and I love paying in Naira."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-info-100 flex items-center justify-center text-info-600 font-semibold">
                  OK
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Oluwaseun K.</div>
                  <div className="text-sm text-gray-500">E-Commerce Owner, Ibadan</div>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "I've tried other OTP services but TonicsTools is by far the best. Great prices, fast delivery, and the interface is so easy to use. It just works."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 font-semibold">
                  BA
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Blessing A.</div>
                  <div className="text-sm text-gray-500">Content Creator, Benin City</div>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "The eSIM feature is a game-changer! I travel frequently and being able to get data instantly in any country without buying a local SIM is amazing. Plus the SMS verification service is top-notch."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                  MI
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mohammed I.</div>
                  <div className="text-sm text-gray-500">Consultant, Kano</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-700)' }}
            >
              Our Promise
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Why <span style={{ color: 'var(--color-primary-500)' }}>TonicsTools</span> stands out
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary-100">
                <Award className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Highest Success Rate</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We maintain the highest SMS delivery success rate in the market through multiple premium providers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-accent-100">
                <Clock className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Always Available</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our platform runs 24/7 with 99.9% uptime. Verify accounts any time of day, any day of the week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-success-100">
                <Layers className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Multiple Providers</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  We aggregate numbers from multiple trusted providers so you always have stock and the best prices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-info-100">
                <CreditCard className="w-6 h-6 text-info-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Pay in Naira</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  No dollar headaches. Fund your wallet easily with card, bank transfer, USSD, or cryptocurrency.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-warning-100">
                <HeartHandshake className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Referral Rewards</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Earn commissions when you refer friends. Both of you get bonus credits when they sign up.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-error-100">
                <ThumbsUp className="w-6 h-6 text-error-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Easy to Use</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Clean, intuitive dashboard. No technical knowledge needed. Pick a number, get your code. That simple.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}
            >
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Frequently asked questions
            </h2>
            <p className="text-gray-600">
              Got questions? We've got answers. If you can't find what you're looking for, contact our support team.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-primary-500)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Ready to grow your online presence?
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Nigerians who trust TonicsTools for SMS verification, social media growth, eSIM data, and more. Create your free account in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all text-lg shadow-lg"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-lg"
            >
              I Already Have an Account
            </Link>
          </div>
          <p className="text-primary-200 text-sm mt-8">
            No credit card required. No hidden fees. Start verifying in under a minute.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--color-sidebar)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center mb-4">
                <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-10 brightness-0 invert" />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Nigeria's most trusted platform for SMS verification, social media growth, eSIM data, and VPN. Fast, reliable, and affordable.
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                ))}
                <span className="text-gray-400 text-sm ml-2">4.9/5 rating</span>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Phone Numbers
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                    SMM Services
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                    eSIM Plans
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                    VPN Plans
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Referral Program
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/acceptable-use" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Acceptable Use
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} TonicsTools. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
