# CD Key ID Updater Webhook Setup

## Overview

To ensure CD keys get proper IDs with `validUntil` dates when created or modified in Sanity Studio, you need to set up the CD Key ID Updater webhook. This webhook is optimized to only trigger when CD keys are actually modified, reducing unnecessary webhook calls.

## Setup Instructions

### 1. Get Your Webhook URL

Your webhook endpoint is: `https://your-domain.com/api/cdkey-id-updater`

### 2. Configure in Sanity Studio

1. Go to your Sanity project dashboard
2. Navigate to **API** → **Webhooks**
3. Click **Create webhook**
4. Configure the webhook:
   - **Name**: `CD Key ID Updater`
   - **URL**: `https://your-domain.com/api/cdkey-id-updater`
   - **Trigger on**: `Create`, `Update`
   - **Filter**: `_type == "program" && defined(cdKeys) && length(cdKeys) > 0`
   - **Projection**: `_id, _type, title, cdKeys[]`

### 3. Test the Webhook

1. Create a new program in Sanity Studio
2. Add CD keys with `validUntil` dates
3. Save the program
4. Check that CD key IDs are generated with the format: `key_{timestamp}_{validUntil}_{uuid8chars}`

**Note:** The webhook will only trigger when you actually modify the `cdKeys` array. Editing other program fields (like title, description) won't trigger the webhook unnecessarily.

## How It Works

1. **When you create/edit CD keys** within a program in Sanity Studio
2. **Webhook triggers** only when `cdKeys` array changes (optimized filtering)
3. **API checks** if any CD keys need ID updates
4. **IDs are regenerated** with proper `validUntil` dates
5. **Program is updated** with new CD key IDs

## Performance Benefits

- ✅ **Reduced webhook load** - Only triggers when CD keys are actually modified
- ✅ **Efficient filtering** - Ignores program updates that don't affect CD keys
- ✅ **Targeted processing** - Only processes documents with CD keys
- ✅ **Lower server load** - Fewer unnecessary API calls

## ID Format

```
key_{timestamp}_{validUntil}_{uuid8chars}
```

Example: `key_dyc7lk_d4rtw8_1202bf74`

- `key_` - Fixed prefix
- `dyc7lk` - 6-char timestamp (when ID was generated)
- `d4rtw8` - 6-char validUntil date (when key expires)
- `1202bf74` - 8-char UUID (ensures uniqueness)

## Troubleshooting

### If IDs aren't updating:

1. Check webhook is configured correctly
2. Verify webhook URL is accessible
3. Check Sanity Studio logs for webhook errors
4. Ensure `validUntil` dates are valid

### If you see placeholder IDs:

- IDs with `000000` in the middle need the webhook to update them
- This happens when CD keys are created before `validUntil` is set
- The webhook will fix these automatically

## Manual ID Update

If you need to manually update IDs, you can:

1. Edit the program in Sanity Studio
2. Save it (this triggers the webhook)
3. Or use the admin dashboard to update key statuses
