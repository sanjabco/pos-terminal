/**
 * IBAN Validation Utility for Iranian IBANs
 * Implements the ISO 13616 standard for IBAN validation
 * 
 * Iranian IBAN format: IR + 24 digits
 * Example: IR430600500901007959216001
 * 
 * Features:
 * - Format validation (IR prefix, 26 characters total)
 * - Mod-97 checksum validation
 * - Automatic formatting and cleaning
 * - Persian error messages
 */

/**
 * Validates an Iranian IBAN according to ISO 13616 standard
 * @param iban - The IBAN string to validate
 * @returns Object with validation result and error message
 */
export const validateIranianIBAN = (iban: string): { isValid: boolean; error?: string } => {
    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Check if IBAN is empty
    if (!cleanIban) {
        return { isValid: false, error: 'شماره شبا نمی‌تواند خالی باشد' };
    }

    // Check if IBAN starts with IR (Iran country code)
    if (!cleanIban.startsWith('IR')) {
        return { isValid: false, error: 'شماره شبا باید با IR شروع شود' };
    }

    // Check if IBAN length is correct (Iranian IBAN is 26 characters)
    if (cleanIban.length !== 26) {
        return { isValid: false, error: 'شماره شبا باید 26 کاراکتر باشد' };
    }

    // Check if all characters after IR are digits
    const accountNumber = cleanIban.substring(2);
    if (!/^\d{24}$/.test(accountNumber)) {
        return { isValid: false, error: 'بعد از IR باید 24 رقم باشد' };
    }

    // Perform mod-97 check
    if (!mod97Check(cleanIban)) {
        return { isValid: false, error: 'شماره شبا نامعتبر است' };
    }

    return { isValid: true };
};

/**
 * Performs the mod-97 check for IBAN validation
 * @param iban - The IBAN string to check
 * @returns true if the IBAN passes the mod-97 check
 */
const mod97Check = (iban: string): boolean => {
    // Move first 4 characters to the end
    const rearranged = iban.substring(4) + iban.substring(0, 4);

    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    let numericString = '';
    for (let i = 0; i < rearranged.length; i++) {
        const char = rearranged[i];
        if (char >= 'A' && char <= 'Z') {
            numericString += (char.charCodeAt(0) - 55).toString();
        } else {
            numericString += char;
        }
    }

    // Calculate mod 97
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
        remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }

    return remainder === 1;
};

/**
 * Formats an IBAN for display (adds spaces every 4 characters)
 * @param iban - The IBAN string to format
 * @returns Formatted IBAN string
 */
export const formatIBAN = (iban: string): string => {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    return cleanIban.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Removes all spaces from an IBAN string
 * @param iban - The IBAN string to clean
 * @returns Clean IBAN string without spaces
 */
export const cleanIBAN = (iban: string): string => {
    return iban.replace(/\s/g, '').toUpperCase();
};

/**
 * Validates and formats an IBAN
 * @param iban - The IBAN string to validate and format
 * @returns Object with validation result, formatted IBAN, and error message
 */
export const validateAndFormatIBAN = (iban: string): {
    isValid: boolean;
    formattedIban?: string;
    cleanIban?: string;
    error?: string;
} => {
    const cleanIban = cleanIBAN(iban);
    const validation = validateIranianIBAN(cleanIban);

    if (validation.isValid) {
        return {
            isValid: true,
            formattedIban: formatIBAN(cleanIban),
            cleanIban: cleanIban
        };
    }

    return {
        isValid: false,
        error: validation.error
    };
};
