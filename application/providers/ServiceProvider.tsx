import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Service {
    id: string;
    title: string;
    amount?: string;
}

interface ServiceContextType {
    selectedServices: Service[];
    setSelectedServices: (services: Service[]) => void;
    addService: (service: Service) => void;
    removeService: (serviceId: string) => void;
    clearServices: () => void;
    isServiceSelected: (serviceId: string) => boolean;
    updateServiceAmount: (serviceId: string, amount: string) => void;
    getTotalAmount: () => number;
    getServicesWithPrices: () => Service[];
    validateAllAmounts: () => boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

interface ServiceProviderProps {
    children: ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);

    const addService = (service: Service) => {
        setSelectedServices(prev => {
            if (!prev.find(s => s.id === service.id)) {
                return [...prev, { ...service, amount: '' }];
            }
            return prev;
        });
    };

    const removeService = (serviceId: string) => {
        setSelectedServices(prev => prev.filter(service => service.id !== serviceId));
    };

    const clearServices = () => {
        setSelectedServices([]);
    };

    const isServiceSelected = (serviceId: string) => {
        return selectedServices.some(service => service.id === serviceId);
    };

    const updateServiceAmount = (serviceId: string, amount: string) => {
        setSelectedServices(prev =>
            prev.map(service =>
                service.id === serviceId
                    ? { ...service, amount }
                    : service
            )
        );
    };

    // Get total amount of all services
    const getTotalAmount = (): number => {
        return selectedServices.reduce((total, service) => {
            const amount = parseFloat(service.amount?.replace(/,/g, '') || '0');
            return total + (isNaN(amount) ? 0 : amount);
        }, 0);
    };

    // Get services that have prices entered
    const getServicesWithPrices = (): Service[] => {
        return selectedServices.filter(service =>
            service.amount && service.amount.trim() !== '' &&
            parseFloat(service.amount.replace(/,/g, '')) > 0
        );
    };

    // Validate that all selected services have valid amounts
    const validateAllAmounts = (): boolean => {
        return selectedServices.every(service => {
            const amount = service.amount?.replace(/,/g, '');
            return amount && amount.trim() !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
        });
    };

    const value: ServiceContextType = {
        selectedServices,
        setSelectedServices,
        addService,
        removeService,
        clearServices,
        isServiceSelected,
        updateServiceAmount,
        getTotalAmount,
        getServicesWithPrices,
        validateAllAmounts,
    };

    return (
        <ServiceContext.Provider value={value}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServiceContext = () => {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error('useServiceContext must be used within a ServiceProvider');
    }
    return context;
}; 