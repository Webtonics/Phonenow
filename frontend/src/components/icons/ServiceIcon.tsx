import { useState, useEffect } from 'react';
import { IconType } from 'react-icons';
import { HiGlobeAlt } from 'react-icons/hi';
import {
  SiWhatsapp,
  SiTelegram,
  SiGoogle,
  SiFacebook,
  SiInstagram,
  SiX,
  SiTiktok,
  SiAmazon,
  SiNetflix,
  SiSpotify,
  SiSnapchat,
  SiLinkedin,
  SiApple,
  SiDiscord,
  SiReddit,
  SiYoutube,
  SiTwitch,
  SiPaypal,
  SiPinterest,
  SiSlack,
} from 'react-icons/si';

// Brand colors for each service
const SERVICE_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  telegram: '#26A5E4',
  google: '#4285F4',
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  x: '#000000',
  tiktok: '#000000',
  amazon: '#FF9900',
  netflix: '#E50914',
  spotify: '#1DB954',
  snapchat: '#FFFC00',
  linkedin: '#0A66C2',
  apple: '#000000',
  discord: '#5865F2',
  reddit: '#FF4500',
  youtube: '#FF0000',
  twitch: '#9146FF',
  paypal: '#003087',
  pinterest: '#BD081C',
  slack: '#4A154B',
};

// Map service names to their icons (only verified icons)
const SERVICE_ICONS: Record<string, IconType> = {
  whatsapp: SiWhatsapp,
  telegram: SiTelegram,
  google: SiGoogle,
  facebook: SiFacebook,
  instagram: SiInstagram,
  twitter: SiX,
  x: SiX,
  tiktok: SiTiktok,
  amazon: SiAmazon,
  netflix: SiNetflix,
  spotify: SiSpotify,
  snapchat: SiSnapchat,
  linkedin: SiLinkedin,
  apple: SiApple,
  discord: SiDiscord,
  reddit: SiReddit,
  youtube: SiYoutube,
  twitch: SiTwitch,
  paypal: SiPaypal,
  pinterest: SiPinterest,
  slack: SiSlack,
};

// Helper to safely normalize service name to string
const normalizeServiceName = (service: unknown): string => {
  if (typeof service === 'string') {
    return service.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  if (service && typeof service === 'object' && 'name' in service) {
    const name = (service as { name: unknown }).name;
    if (typeof name === 'string') {
      return name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }
  return '';
};

interface ServiceIconProps {
  service: unknown;
  size?: number;
  className?: string;
  colored?: boolean;
}

export const ServiceIcon = ({
  service,
  size = 24,
  className = '',
  colored = true
}: ServiceIconProps) => {
  const normalizedService = normalizeServiceName(service);
  const Icon = SERVICE_ICONS[normalizedService];
  const color = colored ? SERVICE_COLORS[normalizedService] : 'currentColor';

  // State to track which image source we are trying
  // 0 = Simple Icons CDN
  // 1 = Google Favicon URL
  // 2 = Fallback Globe
  const [imgSourceLevel, setImgSourceLevel] = useState(0);

  // Reset state when service changes
  useEffect(() => {
    setImgSourceLevel(0);
  }, [normalizedService]);

  // If we have an internal SVG icon, use it immediately
  if (Icon) {
    return <Icon size={size} color={color} className={className} />;
  }

  const handleImgError = () => {
    setImgSourceLevel(prev => prev + 1);
  };

  if (imgSourceLevel === 0) {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <img
          src={`https://cdn.simpleicons.org/${normalizedService}`}
          alt={normalizedService}
          width={size}
          height={size}
          className={`object-contain transition-opacity duration-300 ${colored ? '' : 'grayscale'}`}
          onError={handleImgError}
        />
      </div>
    );
  }

  if (imgSourceLevel === 1) {
    // Try Google Favicons as a robust fallback
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${normalizedService}.com&sz=128`}
          alt={normalizedService}
          width={size}
          height={size}
          className="object-contain rounded-sm"
          onError={handleImgError}
        />
      </div>
    );
  }

  // Fallback to generic globe icon
  return (
    <HiGlobeAlt
      size={size}
      color={colored ? 'var(--color-primary-500)' : 'currentColor'}
      className={className}
    />
  );
};

// Export the service color getter for use elsewhere
export const getServiceColor = (service: unknown): string => {
  const normalizedService = normalizeServiceName(service);
  return SERVICE_COLORS[normalizedService] || 'var(--color-primary-500)';
};

// Check if a service has a dedicated icon
export const hasServiceIcon = (service: unknown): boolean => {
  const normalizedService = normalizeServiceName(service);
  return normalizedService in SERVICE_ICONS;
};
