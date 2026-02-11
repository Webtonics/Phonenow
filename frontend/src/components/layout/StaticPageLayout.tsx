import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface StaticPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/tonicstools_logo.png" alt="TonicsTools" className="h-8 sm:h-9" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>
          )}
          <div className="prose prose-gray max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-gray-900 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:text-gray-600 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:text-gray-600 [&_li]:mb-1.5 [&_li]:leading-relaxed [&_a]:text-primary-600 [&_a]:underline [&_a]:hover:text-primary-700 [&_strong]:text-gray-900">
            {children}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TonicsTools. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/terms" className="text-gray-500 hover:text-gray-700 transition-colors">Terms</Link>
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy</Link>
            <Link to="/refund-policy" className="text-gray-500 hover:text-gray-700 transition-colors">Refunds</Link>
            <Link to="/contact" className="text-gray-500 hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
