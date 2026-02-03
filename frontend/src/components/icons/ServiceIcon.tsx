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

  // If we have an SVG icon, use it
  if (Icon) {
    return <Icon size={size} color={color} className={className} />;
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
