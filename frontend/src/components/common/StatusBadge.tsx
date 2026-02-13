import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SmmOrderStatus, getSmmStatusColor, getSmmStatusLabel } from '@/types/smm';

interface StatusBadgeProps {
  status: SmmOrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * Reusable status badge component for SMM orders
 *
 * @example
 * <StatusBadge status="completed" size="md" showIcon />
 */
export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const getStatusIcon = () => {
    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const iconClass = iconSizes[size];

    switch (status) {
      case 'completed':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'processing':
        return <Loader2 className={`${iconClass} text-blue-600 animate-spin`} />;
      case 'in_progress':
        return <Clock className={`${iconClass} text-yellow-600`} />;
      case 'pending':
        return <Clock className={`${iconClass} text-gray-500`} />;
      case 'partial':
        return <AlertCircle className={`${iconClass} text-orange-600`} />;
      case 'failed':
      case 'cancelled':
        return <XCircle className={`${iconClass} text-red-600`} />;
      default:
        return <Clock className={`${iconClass} text-gray-400`} />;
    }
  };

  const getBadgeColors = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'partial':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'md':
        return 'px-2.5 py-1 text-sm';
      case 'lg':
        return 'px-3 py-1.5 text-base';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border font-medium
        ${getBadgeColors()}
        ${getSizeClasses()}
      `}
    >
      {showIcon && getStatusIcon()}
      {getSmmStatusLabel(status)}
    </span>
  );
}
