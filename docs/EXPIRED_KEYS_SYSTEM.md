# Automatic CD Key Expiration System

This system automatically updates CD key statuses to "expired" when their `validUntil` date has passed, with updates persisted directly to Sanity CMS.

## 🚀 Features

### Server-Side Updates

- **Persistent Changes**: Expired keys are updated directly in Sanity CMS
- **Automatic Processing**: Keys are checked and updated on every program page load
- **Rate Limited**: Middleware prevents excessive updates (5-minute intervals per program)
- **Batch Updates**: API endpoint to update all programs at once

### Real-Time Monitoring

- **Expiring Soon Warnings**: Keys expiring within 24 hours show warnings
- **Visual Indicators**: Clear status badges and notifications
- **Manual Updates**: Admin can manually trigger key updates

## 📁 File Structure

```
src/
├── lib/
│   ├── sanityActions.ts          # Server actions for Sanity updates
│   └── cdKeyUtils.ts            # Utility functions for key processing
├── app/
│   ├── api/update-expired-keys/
│   │   └── route.ts             # API endpoint for batch updates
│   └── program/[slug]/
│       └── page.tsx             # Updated program page
├── components/
│   └── KeyStatusUpdater.tsx   # Manual update component
└── middleware.ts                 # Rate limiting middleware
```

## 🔧 How It Works

### 1. Program Page Load

```typescript
// When a program page loads:
const program = await getProgramWithUpdatedKeys(slug);
// This function:
// 1. Fetches the program from Sanity
// 2. Checks all CD keys for expiration
// 3. Updates expired keys in Sanity
// 4. Returns the updated program data
```

### 2. Key Expiration Logic

```typescript
// Keys are marked as expired if:
const now = new Date();
const validUntil = new Date(key.validUntil);
if (key.status !== "expired" && now > validUntil) {
  // Update status to "expired" in Sanity
}
```

### 3. Rate Limiting

- Middleware prevents updates more than once every 5 minutes per program
- Prevents excessive API calls and database writes
- Uses in-memory cache for tracking

## 🛠️ API Endpoints

### POST /api/update-expired-keys

Updates all expired keys across all programs.

**Response:**

```json
{
  "success": true,
  "message": "Expired keys updated successfully"
}
```

## ⚙️ Configuration

### Vercel Cron Job

```json
{
  "crons": [
    {
      "path": "/api/update-expired-keys",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Runs every 6 hours to update all expired keys.

### Middleware Rate Limiting

- **Interval**: 5 minutes per program
- **Scope**: Program-specific (by slug)
- **Purpose**: Prevent excessive updates

## 🎯 Usage Examples

### Manual Update Component

```tsx
import KeyStatusUpdater from "@/src/components/program/KeyStatusUpdater";

// Add to admin pages or program pages
<KeyStatusUpdater />;
```

### Server Action Usage

```typescript
import { getProgramWithUpdatedKeys } from "@/src/lib/sanityActions";

// Get program with automatically updated keys
const program = await getProgramWithUpdatedKeys("program-slug");
```

### Batch Update All Programs

```typescript
import { updateAllExpiredKeys } from "@/src/lib/sanityActions";

// Update all programs
await updateAllExpiredKeys();
```

## 🔍 Monitoring

### Console Logs

- Successful updates are logged with program IDs
- Errors are logged with detailed messages
- Rate limiting is handled silently

### Visual Indicators

- **Expiring Soon**: Blue warning for keys expiring within 24 hours
- **Expired**: Red status badge for expired keys
- **Last Updated**: Timestamp shown in manual update component

## 🚨 Error Handling

- **Sanity Connection Errors**: Graceful fallback to client-side processing
- **Invalid Dates**: Keys with invalid `validUntil` dates are skipped
- **Network Issues**: Retry logic and error logging
- **Rate Limiting**: Silent handling without user disruption

## 📊 Performance Considerations

- **Efficient Queries**: Only fetches necessary program data
- **Conditional Updates**: Only updates when changes are needed
- **Rate Limiting**: Prevents excessive database writes
- **Caching**: In-memory cache for rate limiting

## 🔄 Migration from Client-Side

The system automatically migrates from client-side processing:

1. Server actions handle all expiration logic
2. Client-side utilities remain for display purposes
3. No breaking changes to existing functionality
4. Improved performance and data consistency

## 🛡️ Security

- **Server Actions**: All updates happen server-side
- **Input Validation**: Date parsing with error handling
- **Rate Limiting**: Prevents abuse and excessive updates
- **Error Logging**: Comprehensive error tracking

This system ensures that CD key statuses are always accurate and up-to-date, providing a better user experience and maintaining data integrity in your Sanity CMS.
