import { Outlet, Link } from 'react-router-dom';
import { Phone } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center space-x-2">
          <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">PhoneNow</span>
        </Link>
        <p className="mt-2 text-center text-sm text-gray-600">
          Get Verified in Seconds
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          <Outlet />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} PhoneNow. All rights reserved.
      </p>
    </div>
  );
};
