import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Wifi,
  Globe,
  Clock,
  TrendingUp,
  Search,
  Phone,
  MessageSquare,
  Zap,
  MapPin,
  ChevronRight,
  Smartphone,
  AlertCircle,
  CheckCircle,
  X,
  SlidersHorizontal,
  Signal,
} from 'lucide-react';
import { esimService, getErrorMessage } from '@/services';
import type { ESIMPackage, ESIMCountry } from '@/types/esim';

// Popular countries to show by default
const POPULAR_COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'SG', 'AE', 'TH', 'AU', 'CA', 'IT', 'ES'];

export function ESIMPackagesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [packages, setPackages] = useState<ESIMPackage[]>([]);
  const [countries, setCountries] = useState<ESIMCountry[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [popularPackages, setPopularPackages] = useState<ESIMPackage[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Filters
  const [selectedCountry, setSelectedCountry] = useState<string>(searchParams.get('country') || '');
  const [selectedRegion, setSelectedRegion] = useState<string>(searchParams.get('region') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'popular' | 'data'>('price');
  const [showFilters, setShowFilters] = useState(false);
  const [filterVoice, setFilterVoice] = useState(false);
  const [filterSms, setFilterSms] = useState(false);

  // Filtered countries for search
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    const term = searchTerm.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [countries, searchTerm]);

  // Popular countries with data
  const popularCountriesData = useMemo(() => {
    return POPULAR_COUNTRIES
      .map((code) => countries.find((c) => c.code === code))
      .filter(Boolean) as ESIMCountry[];
  }, [countries]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load packages when country changes
  useEffect(() => {
    if (selectedCountry) {
      loadPackages();
      setSearchParams({ country: selectedCountry });
    } else {
      setPackages([]);
      setSearchParams({});
    }
  }, [selectedCountry]);

  const loadInitialData = async () => {
    setLoadingInitial(true);
    try {
      const [countriesRes, regionsRes, popularRes] = await Promise.all([
        esimService.getCountries(),
        esimService.getRegions(),
        esimService.getPopularPackages(),
      ]);

      if (countriesRes.data.success) {
        setCountries(countriesRes.data.data);
      }
      if (regionsRes.data.success) {
        setRegions(regionsRes.data.data);
      }
      if (popularRes.data.success) {
        setPopularPackages(popularRes.data.data.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadPackages = async () => {
    if (!selectedCountry) return;

    setLoading(true);
    try {
      const response = await esimService.getPackagesByCountry(selectedCountry);
      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Apply sorting and feature preferences
  const displayedPackages = useMemo(() => {
    let result = [...packages];

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
        break;
      case 'data':
        result.sort((a, b) => b.data_amount - a.data_amount);
        break;
      default:
        result.sort((a, b) => a.selling_price - b.selling_price);
    }

    // Prioritize packages with voice/SMS at the top when toggled
    if (filterVoice || filterSms) {
      result.sort((a, b) => {
        const aScore = (filterVoice && a.has_voice ? 2 : 0) + (filterSms && a.has_sms ? 1 : 0);
        const bScore = (filterVoice && b.has_voice ? 2 : 0) + (filterSms && b.has_sms ? 1 : 0);
        return bScore - aScore;
      });
    }

    return result;
  }, [packages, sortBy, filterVoice, filterSms]);

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    setSearchTerm('');
  };

  const handlePurchase = (pkg: ESIMPackage) => {
    navigate(`/esim/purchase/${pkg.id}`);
  };

  const getSelectedCountryData = () => {
    return countries.find((c) => c.code === selectedCountry);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Global eSIM Data Plans
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay connected anywhere in the world. Instant activation, no physical SIM needed.
          </p>
        </div>

        {/* Device Compatibility - Collapsible */}
        <div className="bg-white border border-primary-100 rounded-xl p-4 mb-6 shadow-sm">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Check Device Compatibility</h3>
                  <p className="text-sm text-gray-500">iPhone XS+, Samsung S20+, Google Pixel 3+ and more</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>iPhone:</strong> XS, XR, 11, 12, 13, 14, 15, 16 series</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Samsung:</strong> S20-S24, Z Fold/Flip 3+</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Google:</strong> Pixel 3, 4, 5, 6, 7, 8, 9 series</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Others:</strong> Most 2020+ flagships with eSIM</span>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Ensure your device is carrier-unlocked. Check Settings → Cellular → Add eSIM for compatibility.</span>
              </div>
            </div>
          </details>
        </div>

        {/* Search and Country Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a country..."
                className="w-full pl-12 pr-12 py-4 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchTerm && filteredCountries.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {filteredCountries.slice(0, 10).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelectCountry(country.code)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="font-medium text-gray-900">{country.name}</p>
                      <p className="text-sm text-gray-500">{country.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Country Display */}
          {selectedCountry && (
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getSelectedCountryData()?.flag}</span>
                <div>
                  <p className="font-semibold text-gray-900">{getSelectedCountryData()?.name}</p>
                  <p className="text-sm text-gray-600">{displayedPackages.length} packages available</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCountry('')}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
              >
                Change Country
              </button>
            </div>
          )}

          {/* Popular Countries Grid */}
          {!selectedCountry && !searchTerm && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Popular Destinations
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {loadingInitial ? (
                  // Skeleton loader
                  Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-gray-100 rounded-xl"></div>
                    </div>
                  ))
                ) : (
                  popularCountriesData.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleSelectCountry(country.code)}
                      className="group flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all"
                    >
                      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                        {country.flag}
                      </span>
                      <span className="text-sm font-medium text-gray-700 text-center truncate w-full">
                        {country.name}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* View All Countries Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => document.querySelector('input')?.focus()}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  Browse all {countries.length} countries
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters Bar - Show when country is selected */}
        {selectedCountry && packages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { value: 'price', label: 'Price' },
                    { value: 'data', label: 'Data' },
                    { value: 'popular', label: 'Popular' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        sortBy === option.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Filters */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterVoice(!filterVoice)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterVoice
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  Voice
                </button>
                <button
                  onClick={() => setFilterSms(!filterSms)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterSms
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-12 bg-gray-200 rounded mt-6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - No Packages */}
        {!loading && selectedCountry && displayedPackages.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Globe className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No packages found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No eSIM packages are currently available for this country.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setSelectedCountry('')}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Choose Another Country
              </button>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        {!loading && displayedPackages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-5">
                  {/* Popular Badge */}
                  {pkg.is_popular && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{pkg.country_flag}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{pkg.country_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary-100 text-sm">{pkg.speeds_formatted}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Main Features */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <Wifi className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Data</p>
                        <p className="font-bold text-gray-900">{pkg.data_formatted}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Validity</p>
                        <p className="font-bold text-gray-900">{pkg.duration_formatted}</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {pkg.has_voice && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <Phone className="h-3 w-3" />
                        {pkg.voice_formatted || 'Voice'}
                      </span>
                    )}
                    {pkg.has_sms && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-info-50 text-info-700 rounded-full text-xs font-medium">
                        <MessageSquare className="h-3 w-3" />
                        {pkg.sms_formatted || 'SMS'}
                      </span>
                    )}
                    {pkg.has_roaming && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                        <MapPin className="h-3 w-3" />
                        Roaming
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
                      <Signal className="h-3 w-3" />
                      {pkg.network_type}
                    </span>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₦{pkg.selling_price.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePurchase(pkg)}
                      className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors group-hover:shadow-md"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Popular Packages Section - Show when no country selected */}
        {!selectedCountry && !loading && popularPackages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary-500" />
              Popular Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 p-5 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{pkg.country_flag}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{pkg.country_name}</h3>
                        <p className="text-sm text-gray-500">{pkg.speeds_formatted}</p>
                      </div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Popular
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Wifi className="h-4 w-4" />
                      {pkg.data_formatted}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {pkg.duration_formatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold text-gray-900">
                      ₦{pkg.selling_price.toLocaleString()}
                    </span>
                    <span className="text-primary-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      View Plan <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            How eSIM Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                icon: Globe,
                title: 'Choose Destination',
                description: 'Select your travel destination and pick a data plan',
              },
              {
                step: 2,
                icon: Wallet,
                title: 'Make Payment',
                description: 'Pay securely using your wallet balance',
              },
              {
                step: 3,
                icon: Smartphone,
                title: 'Scan QR Code',
                description: 'Scan the QR code to install eSIM on your device',
              },
              {
                step: 4,
                icon: Zap,
                title: 'Stay Connected',
                description: 'Activate when you arrive and enjoy fast internet',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                    <item.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Import Wallet icon for the how it works section
import { Wallet } from 'lucide-react';
