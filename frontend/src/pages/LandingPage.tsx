import { Link } from 'react-router-dom';
import { Phone, CheckCircle, Zap, Shield, ArrowRight } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">PhoneNow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Get Verified in Seconds
            <span className="text-primary-500 block">₦900 Only</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Instant phone number verification for Instagram, WhatsApp, Telegram,
            and more. Plus social media marketing services to grow your presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn-primary text-lg px-8 py-3 flex items-center justify-center"
            >
              Start Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="btn-outline text-lg px-8 py-3"
            >
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose PhoneNow?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Delivery
              </h3>
              <p className="text-gray-600">
                Get your verification code within seconds. No waiting, no hassle.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                100+ Services
              </h3>
              <p className="text-gray-600">
                Support for all major platforms - Instagram, WhatsApp, Telegram,
                TikTok, and more.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-accent-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your data is protected. Numbers are used once and discarded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 mb-8">
            No subscriptions, no hidden fees. Pay only for what you use.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Phone Numbers
              </h3>
              <p className="text-4xl font-bold text-primary-500 mb-4">
                From ₦900
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary-500 mr-2" />
                  USA, UK, Canada numbers
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary-500 mr-2" />
                  Instant SMS delivery
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary-500 mr-2" />
                  20 minute validity
                </li>
              </ul>
            </div>
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                SMM Services
              </h3>
              <p className="text-4xl font-bold text-secondary-500 mb-4">
                From ₦200
              </p>
              <ul className="text-left text-gray-600 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary-500 mr-2" />
                  Instagram, TikTok, YouTube
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary-500 mr-2" />
                  Followers, likes, views
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-secondary-500 mr-2" />
                  Fast delivery
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Create your account in 30 seconds and start verifying.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PhoneNow</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} PhoneNow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
