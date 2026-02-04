import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Globe,
  Search,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Filter,
  Zap,
  X,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { phoneService, getErrorMessage } from '@/services';
import { useAuth } from '@/stores/AuthContext';
import { ServiceIcon } from '@/components/icons';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface Country {
  name?: string;
  iso?: number | string;
  prefix?: string | number;
  text_en?: string;
}

interface Service {
  name: string;
  display_name: string;
  quantity: number;
  base_price: number;
  price: number;
  min_price?: number;
  category: string;
}

interface SMS {
  created_at: string;
  text: string;
  code: string;
  sender: string;
}

interface ActiveOrder {
  id: number;
  order_number: string;
  phone: string;
  product: string;
  operator: string;
  country: string;
  status: string;
  price: number;
  sms: SMS[];
  expires: string | null;
  created_at: string;
}

interface OperatorPrice {
  id: string;
  price: number;
  base_price: number;
  available: number;
  success_rate: number;
}

// Popular countries to show first
const POPULAR_COUNTRIES = ['nigeria', 'russia', 'usa', 'england', 'india', 'indonesia', 'philippines'];

// Popular services to show first
const POPULAR_SERVICES = ['whatsapp', 'telegram', 'google', 'facebook', 'instagram', 'twitter', 'tiktok', 'amazon'];

// Country code to ISO mapping (for countries without ISO in API)
const COUNTRY_ISO_MAP: Record<string, string> = {
  nigeria: 'NG', russia: 'RU', usa: 'US', england: 'GB', uk: 'GB', india: 'IN',
  indonesia: 'ID', philippines: 'PH', china: 'CN', netherlands: 'NL', france: 'FR',
  germany: 'DE', canada: 'CA', australia: 'AU', brazil: 'BR', mexico: 'MX',
  spain: 'ES', italy: 'IT', poland: 'PL', ukraine: 'UA', vietnam: 'VN',
  thailand: 'TH', malaysia: 'MY', singapore: 'SG', japan: 'JP', korea: 'KR',
  southkorea: 'KR', turkey: 'TR', egypt: 'EG', southafrica: 'ZA', argentina: 'AR',
  colombia: 'CO', kenya: 'KE', ghana: 'GH', morocco: 'MA', tanzania: 'TZ',
  uganda: 'UG', ethiopia: 'ET', pakistan: 'PK', bangladesh: 'BD', srilanka: 'LK',
  nepal: 'NP', myanmar: 'MM', cambodia: 'KH', laos: 'LA', taiwan: 'TW',
  hongkong: 'HK', macau: 'MO', mongolia: 'MN', kazakhstan: 'KZ', uzbekistan: 'UZ',
  kyrgyzstan: 'KG', azerbaijan: 'AZ', georgia: 'GE', armenia: 'AM', israel: 'IL',
  uae: 'AE', saudiarabia: 'SA', qatar: 'QA', kuwait: 'KW', oman: 'OM',
  bahrain: 'BH', jordan: 'JO', lebanon: 'LB', iraq: 'IQ', iran: 'IR',
  afghanistan: 'AF', yemen: 'YE', syria: 'SY', sweden: 'SE', norway: 'NO',
  denmark: 'DK', finland: 'FI', austria: 'AT', switzerland: 'CH', belgium: 'BE',
  portugal: 'PT', greece: 'GR', czech: 'CZ', slovakia: 'SK', hungary: 'HU',
  romania: 'RO', bulgaria: 'BG', serbia: 'RS', croatia: 'HR', slovenia: 'SI',
  bosnia: 'BA', albania: 'AL', northmacedonia: 'MK', montenegro: 'ME', kosovo: 'XK',
  moldova: 'MD', belarus: 'BY', lithuania: 'LT', latvia: 'LV', estonia: 'EE',
  ireland: 'IE', peru: 'PE', chile: 'CL', venezuela: 'VE', ecuador: 'EC',
  bolivia: 'BO', paraguay: 'PY', uruguay: 'UY', costarica: 'CR', panama: 'PA',
  guatemala: 'GT', honduras: 'HN', salvador: 'SV', nicaragua: 'NI', dominicanrepublic: 'DO',
  dominican: 'DO', puertorico: 'PR', jamaica: 'JM', haiti: 'HT', cuba: 'CU',
  trinidadandtobago: 'TT', trinidad: 'TT', newzealand: 'NZ',
};

export const PhoneNumbersPage = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const servicesAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const [countries, setCountries] = useState<Record<string, Country>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('nigeria');
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Operator selection modal state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [operatorPrices, setOperatorPrices] = useState<OperatorPrice[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [purchasingOperator, setPurchasingOperator] = useState<string | null>(null);
  const [operatorError, setOperatorError] = useState<string | null>(null);

  // Debounced country for API calls
  const debouncedCountry = useDebounce(selectedCountry, 300);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      servicesAbortRef.current?.abort();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch countries on mount with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 2;

    const fetchCountries = async () => {
      try {
        const response = await phoneService.getCountries();
        if (!mountedRef.current) return;

        if (response.data.success && response.data.data) {
          const countriesData = response.data.data as Record<string, Country>;
          setCountries(countriesData);

          // If we got countries but Nigeria isn't in the list, select the first available
          if (Object.keys(countriesData).length > 0 && !countriesData['nigeria']) {
            setSelectedCountry(Object.keys(countriesData)[0]);
          }
        }
      } catch (error) {
        if (!mountedRef.current) return;

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying countries fetch (${retryCount}/${maxRetries})...`);
          setTimeout(fetchCountries, 1000 * retryCount);
          return;
        }
        toast.error('Failed to load countries. Please refresh the page.');
      } finally {
        if (mountedRef.current) {
          setLoadingCountries(false);
        }
      }
    };

    fetchCountries();
  }, []);

  // Fetch services when country changes (debounced)
  useEffect(() => {
    const fetchServices = async () => {
      if (!debouncedCountry) return;

      // Abort any previous request
      servicesAbortRef.current?.abort();
      servicesAbortRef.current = new AbortController();

      setLoadingServices(true);
      setServicesError(null);

      try {
        const response = await phoneService.getServices(debouncedCountry);

        // Check if component is still mounted and this is still the current request
        if (!mountedRef.current) return;

        if (response.data.success && response.data.data) {
          setServices(response.data.data);
          setServicesError(null);
        } else {
          setServicesError('Failed to load services');
        }
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') return;
        if (!mountedRef.current) return;

        const message = getErrorMessage(error);
        setServicesError(message);
        toast.error(message);
      } finally {
        if (mountedRef.current) {
          setLoadingServices(false);
        }
      }
    };

    fetchServices();
  }, [debouncedCountry]);

  // Fetch active orders (reduced polling to 15s, only polls if there are active orders)
  const fetchActiveOrders = useCallback(async () => {
    try {
      const response = await phoneService.getOrders({ status: 'processing', per_page: 10 });
      if (mountedRef.current && response.data.success) {
        setActiveOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchActiveOrders();
    // Only poll if there might be active orders (reduce unnecessary API calls)
    const interval = setInterval(() => {
      if (activeOrders.length > 0) {
        fetchActiveOrders();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveOrders, activeOrders.length]);

  // Open pricing modal and fetch operator prices
  const handleBuyNumber = async (service: Service) => {
    setSelectedService(service);
    setShowPricingModal(true);
    setLoadingOperators(true);
    setOperatorPrices([]);
    setOperatorError(null);

    // Check if offline before making request
    if (!navigator.onLine) {
      setOperatorError('No internet connection. Please check your network and try again.');
      setLoadingOperators(false);
      return;
    }

    try {
      const response = await phoneService.getOperatorPrices(selectedCountry, service.name);
      if (response.data.success && response.data.data) {
        // Sort by price (cheapest first)
        const sorted = [...response.data.data].sort((a, b) => a.price - b.price);
        setOperatorPrices(sorted);
        setOperatorError(null);
      } else {
        setOperatorError('Failed to load pricing options. Please try again.');
      }
    } catch (error: unknown) {
      // Check for network/offline errors
      const isNetworkError =
        !navigator.onLine ||
        (error instanceof Error && (
          error.message === 'Network Error' ||
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('failed to fetch') ||
          (error as { code?: string }).code === 'ERR_NETWORK'
        ));

      if (isNetworkError) {
        setOperatorError('No internet connection. Please check your network and try again.');
      } else {
        const message = getErrorMessage(error);
        setOperatorError(message || 'Failed to load prices. Please try again.');
      }
    } finally {
      setLoadingOperators(false);
    }
  };

  // Retry fetching operator prices
  const retryFetchOperatorPrices = () => {
    if (selectedService) {
      handleBuyNumber(selectedService);
    }
  };

  // Purchase with selected operator
  const handlePurchaseWithOperator = async (operatorId: string) => {
    if (!selectedService) return;

    setPurchasingOperator(operatorId);
    try {
      const response = await phoneService.buyNumber(selectedCountry, operatorId, selectedService.name);
      if (response.data.success) {
        toast.success('Number purchased successfully!');
        await refreshUser();
        setShowPricingModal(false);
        setSelectedService(null);

        // Redirect to order detail page
        const orderId = response.data.data.order_id;
        navigate(`/orders/${orderId}`);
      } else {
        toast.error('Failed to purchase number');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPurchasingOperator(null);
    }
  };

  // Close modal
  const closePricingModal = () => {
    setShowPricingModal(false);
    setSelectedService(null);
    setOperatorPrices([]);
    setOperatorError(null);
  };

  // Get country flag URL from flagsapi.com
  const getFlagUrl = (countryKey: string, country?: Country) => {
    const key = countryKey.toLowerCase().replace(/\s+/g, '');
    // First try ISO from country data, then from mapping
    const iso = country?.iso?.toString().toUpperCase() || COUNTRY_ISO_MAP[key] || '';
    if (iso && iso.length === 2) {
      return `https://flagsapi.com/${iso}/flat/64.png`;
    }
    return null;
  };

  // Filter and sort countries for dropdown
  const filteredCountries = Object.entries(countries)
    .filter(([key, country]) => {
      if (!countrySearch) return true;
      const searchLower = countrySearch.toLowerCase();
      return (
        key.toLowerCase().includes(searchLower) ||
        String(country.text_en || '').toLowerCase().includes(searchLower) ||
        String(country.name || '').toLowerCase().includes(searchLower)
      );
    })
    .sort(([keyA], [keyB]) => {
      const aPopular = POPULAR_COUNTRIES.indexOf(keyA.toLowerCase());
      const bPopular = POPULAR_COUNTRIES.indexOf(keyB.toLowerCase());
      if (aPopular !== -1 && bPopular === -1) return -1;
      if (aPopular === -1 && bPopular !== -1) return 1;
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      return keyA.localeCompare(keyB);
    });

  // Filter and sort services
  const filteredServices = services
    .filter(s =>
      String(s.display_name || '').toLowerCase().includes(serviceSearch.toLowerCase()) ||
      String(s.name || '').toLowerCase().includes(serviceSearch.toLowerCase())
    )
    .sort((a, b) => {
      // Popular services first
      const aPopular = POPULAR_SERVICES.indexOf(String(a.name || '').toLowerCase());
      const bPopular = POPULAR_SERVICES.indexOf(String(b.name || '').toLowerCase());
      if (aPopular !== -1 && bPopular === -1) return -1;
      if (aPopular === -1 && bPopular !== -1) return 1;
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      // Then by quantity
      return b.quantity - a.quantity;
    });

  const selectedCountryData = countries[selectedCountry];

  if (loadingCountries) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-60 w-60 rounded-full bg-white opacity-5 blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-white/20 to-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
              <Phone className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Buy Phone Numbers</h1>
              <p className="text-primary-100 text-sm sm:text-base md:text-lg">Get instant temporary numbers for SMS verification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-gradient-to-br from-accent-400/20 to-accent-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-accent-300/30 hover:scale-105 transition-transform shadow-lg">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-accent-400/30 rounded-lg">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent-200" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-accent-100">Instant Delivery</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">1-5 mins</p>
            </div>
            <div className="bg-gradient-to-br from-success-400/20 to-success-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-success-300/30 hover:scale-105 transition-transform shadow-lg">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-success-400/30 rounded-lg">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-success-200" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-success-100">Countries</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{Object.keys(countries).length}+</p>
            </div>
            <div className="bg-gradient-to-br from-primary-300/20 to-primary-400/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-primary-200/30 hover:scale-105 transition-transform shadow-lg">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-primary-300/30 rounded-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-100" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-primary-100">Services</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{services.length}+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Country Selection - Searchable Dropdown */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Globe className="w-4 h-4 inline mr-2" />
          Select Country
        </label>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-primary-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <div className="flex items-center gap-3">
              {getFlagUrl(selectedCountry, selectedCountryData) ? (
                <img
                  src={getFlagUrl(selectedCountry, selectedCountryData)!}
                  alt={selectedCountry}
                  className="w-8 h-6 object-cover rounded shadow-sm"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <Globe className="w-8 h-6 text-gray-400" />
              )}
              <p className="font-semibold text-gray-900 capitalize">
                {selectedCountryData?.text_en || selectedCountryData?.name || selectedCountry}
              </p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showCountryDropdown && (
            <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No countries found</p>
                  </div>
                ) : (
                  filteredCountries.map(([key, country]) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key !== selectedCountry) {
                          setSelectedCountry(key);
                          setServices([]); // Clear services immediately
                          setLoadingServices(true); // Show loading immediately
                          setServicesError(null);
                        }
                        setShowCountryDropdown(false);
                        setCountrySearch('');
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-primary-50 transition-colors ${
                        selectedCountry === key ? 'bg-primary-100' : ''
                      }`}
                    >
                      {getFlagUrl(key, country) ? (
                        <img
                          src={getFlagUrl(key, country)!}
                          alt={key}
                          className="w-7 h-5 object-cover rounded shadow-sm"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Globe className="w-7 h-5 text-gray-400" />
                      )}
                      <p className="font-medium text-gray-900 flex-1 text-left capitalize">
                        {country.text_en || country.name || key}
                      </p>
                      {POPULAR_COUNTRIES.includes(key.toLowerCase()) && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          Popular
                        </span>
                      )}
                      {selectedCountry === key && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Filter className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Available Services</h2>
              <p className="text-sm text-gray-600">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Service Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services (WhatsApp, Telegram, etc.)"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {loadingServices ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <p className="text-gray-500 mt-3 text-sm">Loading services...</p>
          </div>
        ) : servicesError ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Services</h3>
            <p className="text-gray-600 mb-4">{servicesError}</p>
            <button
              onClick={() => {
                setServicesError(null);
                setLoadingServices(true);
                phoneService.getServices(selectedCountry)
                  .then(response => {
                    if (response.data.success && response.data.data) {
                      setServices(response.data.data);
                    }
                  })
                  .catch(() => setServicesError('Failed to load services'))
                  .finally(() => setLoadingServices(false));
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
            <p className="text-gray-600">Try selecting a different country or adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredServices.map((service) => {
              const isPopular = POPULAR_SERVICES.includes(String(service.name || '').toLowerCase());

              return (
                <div
                  key={service.name}
                  className={`group relative border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 transition-all duration-200 ${
                    isPopular
                      ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 hover:shadow-2xl hover:scale-[1.02] sm:hover:scale-[1.03] hover:border-amber-500'
                      : 'border-gray-200 bg-white hover:border-primary-400 hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02]'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl flex items-center gap-1 animate-pulse">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden xs:inline">Popular</span>
                      <span className="xs:hidden">Hot</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <ServiceIcon service={service.name || ''} size={36} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">{service.display_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          service.quantity > 100
                            ? 'bg-green-100 text-green-700'
                            : service.quantity > 10
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {service.quantity} available
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3 sm:pt-4 border-t-2 border-gray-100">
                    <button
                      onClick={() => handleBuyNumber(service)}
                      disabled={service.quantity === 0}
                      className={`w-full px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold transition-all shadow-md text-sm sm:text-base ${
                        service.quantity === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : isPopular
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white hover:shadow-2xl hover:scale-105 sm:hover:scale-110 disabled:opacity-50'
                            : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 hover:shadow-2xl hover:scale-105 disabled:opacity-50'
                      }`}
                    >
                      {service.quantity === 0 ? 'Sold Out' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pricing Options Modal */}
      {showPricingModal && selectedService && (() => {
        // Filter out sold-out options and sort by price
        const availableOptions = operatorPrices.filter(op => op.available > 0);
        const cheapestPrice = availableOptions.length > 0 ? Math.min(...availableOptions.map(op => op.price)) : 0;
        const premiumPrice = availableOptions.length > 0 ? Math.max(...availableOptions.map(op => op.price)) : 0;

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closePricingModal}
          >
            <div
              className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in max-h-[85vh] sm:max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <button
                  onClick={closePricingModal}
                  className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all hover:rotate-90 duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ServiceIcon service={selectedService.name} size={32} colored={false} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">{selectedService.display_name}</h3>
                    <p className="text-primary-100 text-sm mt-0.5">Choose your preferred option</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {loadingOperators ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-primary-100"></div>
                      <div className="w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin absolute inset-0"></div>
                    </div>
                    <p className="text-gray-500 mt-4 font-medium">Finding best prices...</p>
                  </div>
                ) : operatorError ? (
                  <div className="text-center py-16">
                    {operatorError.toLowerCase().includes('internet') || operatorError.toLowerCase().includes('network') ? (
                      <>
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <WifiOff className="w-8 h-8 text-orange-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Internet Connection</h4>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Prices</h4>
                      </>
                    )}
                    <p className="text-gray-500 text-sm mb-6">{operatorError}</p>
                    <button
                      onClick={retryFetchOperatorPrices}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 transition-all shadow-md hover:shadow-lg"
                    >
                      Try Again
                    </button>
                  </div>
                ) : availableOptions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Numbers Available</h4>
                    <p className="text-gray-500 text-sm">Please try again later or select a different service.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableOptions.map((op) => {
                      const isCheapest = op.price === cheapestPrice;
                      const isPremium = op.price === premiumPrice && availableOptions.length > 1;

                      return (
                        <button
                          key={op.id}
                          onClick={() => handlePurchaseWithOperator(op.id)}
                          disabled={purchasingOperator !== null}
                          className={`relative w-full text-left rounded-2xl p-4 transition-all duration-200 disabled:opacity-70 ${
                            isCheapest
                              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-400 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100'
                              : isPremium
                                ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-400 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100'
                                : 'bg-gray-50 border-2 border-gray-200 hover:border-primary-300 hover:bg-white hover:shadow-md'
                          }`}
                        >
                          {/* Tag Badge */}
                          {isCheapest && (
                            <div className="absolute -top-2.5 left-4 px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full shadow-md">
                              Cheapest
                            </div>
                          )}
                          {isPremium && !isCheapest && (
                            <div className="absolute -top-2.5 left-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-md">
                              Premium
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-2">
                                <span className={`text-2xl sm:text-3xl font-bold ${
                                  isCheapest ? 'text-emerald-600' : isPremium ? 'text-purple-600' : 'text-gray-900'
                                }`}>
                                  ₦{op.price.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  op.available > 50 ? 'bg-green-500' : op.available > 20 ? 'bg-yellow-500' : 'bg-orange-500'
                                }`}></div>
                                <span className="text-sm text-gray-600">
                                  {op.available} numbers available
                                </span>
                              </div>
                            </div>

                            <div className={`shrink-0 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                              purchasingOperator === op.id
                                ? 'bg-gray-200 text-gray-500'
                                : isCheapest
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200'
                                  : isPremium
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-200'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200'
                            }`}>
                              {purchasingOperator === op.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                'Buy'
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {availableOptions.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 shrink-0">
                  <p className="text-xs text-gray-500 text-center">
                    Premium options typically have higher success rates and faster delivery
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
