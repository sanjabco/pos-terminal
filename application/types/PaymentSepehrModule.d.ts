declare module 'react-native' {
    interface NativeModulesStatic {
        PaymentSepehrModule: {
            /**
             * Purchase with Sepehr payment system
             * @param amount - Payment amount as string
             * @param type - Payment type: "1" for regular payment, "2" for tashim (split payment)
             * @returns Promise with success status and message
             */
            purchase(amount: string, type: string): Promise<{
                success: boolean;
                message: string;
            }>;

            /**
             * Purchase with dynamic tashim (split payment) data
             * @param amount - Total payment amount as string
             * @param tashimData - Array of tashim data in format "IBAN:amount"
             * @returns Promise with success status and message
             */
            purchaseTashim(amount: string, tashimData: string[]): Promise<{
                success: boolean;
                message: string;
            }>;

            // NativeModule required properties
            addListener(eventName: string): void;
            removeListeners(count: number): void;

            // Index signature for dynamic method calls
            [key: string]: any;
        };
    }
}

export { }; 