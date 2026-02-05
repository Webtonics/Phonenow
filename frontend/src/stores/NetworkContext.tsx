import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NetworkContextType {
    isOnline: boolean;
    isOffline: boolean; // Convenience property
    checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Back online!', { id: 'network-status' });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error('No internet connection', { id: 'network-status', duration: Infinity });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const checkConnection = async (): Promise<boolean> => {
        try {
            // Try to fetch a small resource or ping an endpoint
            // Using fetch with no-cache to ensure we hit the network
            const response = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
            const online = response.ok || response.status < 500;
            setIsOnline(online);
            return online;
        } catch (error) {
            setIsOnline(false);
            return false;
        }
    };

    return (
        <NetworkContext.Provider value={{ isOnline, isOffline: !isOnline, checkConnection }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};
