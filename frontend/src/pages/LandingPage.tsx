import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Phone,
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
    answer: 'We accept payments via Flutterwave, supporting bank transfers, cards, and mobile money. Simply enter your desired amount, complete the payment, and your wallet is instantly credited.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption to protect your data. Phone numbers are temporary and discarded after use. We never store your verification codes or share your information with third parties.',
  },
  {
    question: 'Can I use this for business purposes?',
    answer: 'Yes! Many businesses use our service for testing, development, and legitimate verification needs. We offer competitive rates for high-volume users. Contact us for enterprise solutions.',
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
            <Link to="/" className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                PhoneNow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Features
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
                Start Free
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
                    Start Free
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl translate-y-1/2"></div>

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
                Trusted by <span className="font-semibold text-gray-900">10,000+</span> users
              </span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              Instant Phone Verification
              <span className="block mt-2" style={{ color: 'var(--color-primary-500)' }}>
                For Any Platform
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Get temporary phone numbers from 100+ countries in seconds.
              Verify accounts on WhatsApp, Telegram, Google, and 500+ services.
              <span className="font-semibold text-gray-900"> Full refund if it doesn't work.</span>
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-all"
                style={{ color: 'var(--color-text-primary)' }}
              >
                See How It Works
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500">
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
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar - Supported Services */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">
            Works with all major platforms you need
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
              Why PhoneNow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Everything you need for
              <span style={{ color: 'var(--color-primary-500)' }}> seamless verification</span>
            </h2>
            <p className="text-lg text-gray-600">
              We've built the most reliable, fastest, and most affordable phone verification service. Here's why thousands choose us.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <RefreshCcw className="w-7 h-7" style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                100% Refund Guarantee
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Didn't receive your SMS? Get a full refund instantly. No questions asked, no hassle. Your money is always protected.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-accent-100)' }}
              >
                <Zap className="w-7 h-7" style={{ color: 'var(--color-accent-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Lightning Fast Delivery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get your verification code in 1-5 seconds. Our system automatically fetches SMS the moment it arrives. No waiting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-success-100)' }}
              >
                <Globe className="w-7 h-7" style={{ color: 'var(--color-success-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Global Coverage
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Access phone numbers from 100+ countries including USA, UK, Russia, India, and Nigeria. Perfect for any region.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-info-100)' }}
              >
                <CreditCard className="w-7 h-7" style={{ color: 'var(--color-info-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Best Prices
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Competitive pricing with no hidden fees. Pay only for what you use. Bulk discounts available for high-volume users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }}
            >
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Get verified in <span style={{ color: 'var(--color-primary-500)' }}>3 easy steps</span>
            </h2>
            <p className="text-lg text-gray-600">
              No complicated setup. No technical knowledge required. Just pick a number and get your code.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                1
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Choose Your Number
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Select a country and the service you need to verify (WhatsApp, Google, etc.). Browse available numbers and pick one.
              </p>
              {/* Connector line - hidden on mobile */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                2
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Request Verification
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Use the phone number on the platform you're verifying. Request the SMS code as you normally would.
              </p>
              {/* Connector line - hidden on mobile */}
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary-500)' }}
              >
                3
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Get Your Code
              </h3>
              <p className="text-gray-600 leading-relaxed">
                The SMS arrives in seconds on your dashboard. Copy the code and complete your verification. Done!
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              Try It Now - It's Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Money-Back Guarantee Section */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-primary-50)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-primary-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--color-success-100)' }}
                >
                  <Shield className="w-10 h-10" style={{ color: 'var(--color-success-600)' }} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  100% Money-Back Guarantee
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  We're so confident in our service that we offer a complete refund if you don't receive your SMS.
                  If the number doesn't work, simply cancel and your money is instantly returned to your wallet.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>Instant refund to your wallet</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>No questions asked policy</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-success-500 shrink-0" />
                    <span>Cancel anytime within validity period</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl p-8 text-center">
                  <div className="text-6xl font-bold mb-2" style={{ color: 'var(--color-primary-600)' }}>
                    100%
                  </div>
                  <div className="text-xl font-semibold text-gray-700 mb-4">
                    Satisfaction Rate
                  </div>
                  <p className="text-gray-600">
                    Join thousands of satisfied customers who trust PhoneNow for their verification needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-24 bg-white">
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
              Built for <span style={{ color: 'var(--color-primary-500)' }}>everyone</span>
            </h2>
            <p className="text-lg text-gray-600">
              Whether you're a developer, individual, or business - PhoneNow has you covered.
            </p>
          </div>

          {/* Use case cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Developers */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Code2 className="w-7 h-7" style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Developers & Testers
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Perfect for testing SMS verification flows in your applications. Get numbers on demand without managing real SIM cards.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Test authentication flows
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  QA multiple accounts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  API integration ready
                </li>
              </ul>
            </div>

            {/* Individuals */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-accent-100)' }}
              >
                <Users className="w-7 h-7" style={{ color: 'var(--color-accent-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Individuals
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Protect your privacy by keeping your personal number private. Verify accounts without exposing your real phone number.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Privacy protection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Multiple account verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  No spam on your number
                </li>
              </ul>
            </div>

            {/* Businesses */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--color-success-100)' }}
              >
                <Building2 className="w-7 h-7" style={{ color: 'var(--color-success-600)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Businesses
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Scale your operations with reliable verification. Perfect for marketing agencies, e-commerce, and customer service teams.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  High volume support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Dedicated support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  Enterprise pricing
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
              Trusted by thousands worldwide
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
              <div className="text-gray-400">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-accent-400)' }}>
                500+
              </div>
              <div className="text-gray-400">Services</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-success-400)' }}>
                10K+
              </div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--color-info-400)' }}>
                99.9%
              </div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* eSIM Teaser Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                  <Wifi className="w-4 h-4" />
                  New Feature
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Stay Connected Anywhere with eSIM
                </h2>
                <p className="text-lg text-primary-100 mb-6 leading-relaxed">
                  Get instant mobile data in 100+ countries without physical SIM cards.
                  Perfect for travelers, remote workers, and digital nomads.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all"
                >
                  Explore eSIM Plans
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
                  <Wifi className="w-16 h-16 text-white mx-auto mb-4" />
                  <div className="text-2xl font-bold text-white">Global eSIM</div>
                  <div className="text-primary-100">Instant Activation</div>
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
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              What our customers say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                "PhoneNow saved me so much time. I needed to verify multiple accounts for my business and this service delivered every time. The refund guarantee gave me confidence to try it."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                  AO
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Adebayo O.</div>
                  <div className="text-sm text-gray-500">Business Owner</div>
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
                "As a developer, I need to test SMS verification constantly. PhoneNow gives me numbers from multiple countries instantly. Best service I've used."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-semibold">
                  CE
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Chidi E.</div>
                  <div className="text-sm text-gray-500">Software Developer</div>
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
                "The speed is incredible - I get my codes in seconds. And when one number didn't work, I got my refund immediately. Truly reliable service."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center text-success-600 font-semibold">
                  FN
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Fatima N.</div>
                  <div className="text-sm text-gray-500">Digital Marketer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}
            >
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust PhoneNow for fast, reliable phone verification. Create your free account today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              I Already Have an Account
            </Link>
          </div>
          <p className="text-primary-200 text-sm mt-6">
            No credit card required. Start verifying in under a minute.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--color-sidebar)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary-500)' }}
                >
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">PhoneNow</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                Fast, reliable phone verification for everyone. Get SMS codes from 100+ countries instantly.
              </p>
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
                    eSIM Plans
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} PhoneNow. All rights reserved.
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
