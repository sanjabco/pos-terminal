# Environment Configuration

This directory contains environment configuration for the POS system.

## POS Environment Setup

The application uses a simplified configuration for the POS system.

### Code Usage

```typescript
import ENV from '../config/env';

// Check which POS to use
if (ENV.isSepehrPOS()) {
  // Use Sepehr payment module
  callSepehr('purchase', amount, "1");
} else {
  // Use default payment module
  call('purchaseWithId', amount, id, true, true);
}
```

### Current Configuration

- The app is configured to use Sepehr POS by default
- No environment variables are required
- Configuration is handled in `application/config/env.ts` 