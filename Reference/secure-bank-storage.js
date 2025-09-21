/**
 * Secure Bank Storage System
 * Handles encryption and secure storage of bank account information
 */

// Encryption utilities using Web Crypto API
class SecureBankStorage {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
    }

    // Generate encryption key from password
    async generateKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password + salt),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.algorithm, length: this.keyLength },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt bank data
    async encryptBankData(bankData, password) {
        try {
            const salt = this.generateSalt();
            const key = await this.generateKey(password, salt);
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify(bankData));
            
            const encryptedData = await crypto.subtle.encrypt(
                { name: this.algorithm, iv: iv },
                key,
                data
            );
            
            return {
                encrypted: Array.from(new Uint8Array(encryptedData)),
                iv: Array.from(iv),
                salt: salt,
                algorithm: this.algorithm
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt bank data');
        }
    }

    // Decrypt bank data
    async decryptBankData(encryptedData, password) {
        try {
            const key = await this.generateKey(password, encryptedData.salt);
            const iv = new Uint8Array(encryptedData.iv);
            const data = new Uint8Array(encryptedData.encrypted);
            
            const decryptedData = await crypto.subtle.decrypt(
                { name: this.algorithm, iv: iv },
                key,
                data
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedData));
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt bank data');
        }
    }

    // Generate random salt
    generateSalt() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Hash sensitive data for storage
    async hashSensitiveData(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Bank data collection and validation
class BankDataCollector {
    constructor() {
        this.secureStorage = new SecureBankStorage();
    }

    // Validate routing number (US format)
    validateRoutingNumber(routingNumber) {
        if (!routingNumber || routingNumber.length !== 9) {
            return { valid: false, error: 'Routing number must be 9 digits' };
        }
        
        if (!/^\d{9}$/.test(routingNumber)) {
            return { valid: false, error: 'Routing number must contain only digits' };
        }
        
        // Basic checksum validation
        const digits = routingNumber.split('').map(Number);
        const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
        let sum = 0;
        
        for (let i = 0; i < 9; i++) {
            sum += digits[i] * weights[i];
        }
        
        if (sum % 10 !== 0) {
            return { valid: false, error: 'Invalid routing number checksum' };
        }
        
        return { valid: true };
    }

    // Validate account number
    validateAccountNumber(accountNumber) {
        if (!accountNumber || accountNumber.length < 4) {
            return { valid: false, error: 'Account number must be at least 4 digits' };
        }
        
        if (!/^\d+$/.test(accountNumber)) {
            return { valid: false, error: 'Account number must contain only digits' };
        }
        
        return { valid: true };
    }

    // Collect and encrypt bank data
    async collectBankData(bankName, routingNumber, accountNumber, accountType) {
        // Validate inputs
        const routingValidation = this.validateRoutingNumber(routingNumber);
        if (!routingValidation.valid) {
            throw new Error(routingValidation.error);
        }
        
        const accountValidation = this.validateAccountNumber(accountNumber);
        if (!accountValidation.valid) {
            throw new Error(accountValidation.error);
        }
        
        // Create bank data object
        const bankData = {
            bankName: bankName.trim(),
            routingNumber: routingNumber,
            accountNumber: accountNumber,
            accountType: accountType,
            lastFour: accountNumber.slice(-4),
            createdAt: new Date().toISOString(),
            hash: await this.secureStorage.hashSensitiveData(routingNumber + accountNumber)
        };
        
        // Generate encryption password (combine user email + timestamp + random)
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        const encryptionPassword = `${bankData.hash}_${timestamp}_${random}`;
        
        // Encrypt the data
        const encryptedData = await this.secureStorage.encryptBankData(bankData, encryptionPassword);
        
        return {
            encrypted: encryptedData,
            encryptionKey: encryptionPassword, // Store the key for admin decryption
            lastFour: bankData.lastFour,
            bankName: bankData.bankName,
            accountType: bankData.accountType,
            hash: bankData.hash
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecureBankStorage, BankDataCollector };
} else {
    window.SecureBankStorage = SecureBankStorage;
    window.BankDataCollector = BankDataCollector;
} 