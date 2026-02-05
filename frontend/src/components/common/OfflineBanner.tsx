import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetwork } from '@/stores/NetworkContext';
import { useState } from 'react';

export const OfflineBanner = () => {
    const { isOnline, checkConnection } = useNetwork();
    const [isChecking, setIsChecking] = useState(false);

    if (isOnline) return null;

    const handleCheck = async () => {
        setIsChecking(true);
        await checkConnection();
        setIsChecking(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg animate-slide-up">
            <div className="container mx-auto max-w-7xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <WifiOff className="w-5 h-5 animate-pulse" />
                    <div>
                        <p className="font-semibold text-sm sm:text-base">You are currently offline</p>
                        <p className="text-red-100 text-xs sm:text-sm hidden sm:block">
                            Some features may not be available until connection is restored.
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleCheck}
                    disabled={isChecking}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? 'Checking...' : 'Retry'}
                </button>
            </div>
        </div>
    );
};
