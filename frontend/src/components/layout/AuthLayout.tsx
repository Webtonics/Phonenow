import { Outlet, Link } from 'react-router-dom';
import { Smartphone, Shield, Zap } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-secondary-600/90 z-10" />
        <div className="relative z-20 flex flex-col justify-center px-12 xl:px-20 text-white">
          <Link to="/" className="flex items-center space-x-3 mb-8">
            <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-14 brightness-0 invert" />
          </Link>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Your Gateway to<br />Global Verification
          </h1>

          <p className="text-xl text-white/90 mb-12 leading-relaxed">
            Access virtual phone numbers and eSIM profiles from 190+ countries.
            Verify accounts, protect your privacy, stay connected.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Instant Activation</h3>
                <p className="text-white/80">Get your virtual number or eSIM in seconds</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
                <p className="text-white/80">Your data is encrypted and protected</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Global Coverage</h3>
                <p className="text-white/80">190+ countries, thousands of services</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 xl:px-12 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden justify-center items-center mb-8">
            <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-12" />
          </Link>

          {/* Auth Card */}
          <div className="bg-white py-10 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gray-100">
            <Outlet />
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} TonicsTools. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
