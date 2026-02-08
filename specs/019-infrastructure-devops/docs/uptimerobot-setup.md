# UptimeRobot Setup Guide

## 1. Create Account

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for a free account (50 monitors included)

## 2. Add Frontend Monitor

1. Click "Add New Monitor"
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: viably.dev (Frontend)
   - **URL**: `https://viably.dev`
   - **Monitoring Interval**: 5 minutes
3. Save

## 3. Add Backend Monitor

1. Click "Add New Monitor"
2. Configure:
   - **Monitor Type**: HTTP(s) - Keyword
   - **Friendly Name**: api.viably.dev (Backend API)
   - **URL**: `https://api.viably.dev/health`
   - **Monitoring Interval**: 5 minutes
   - **Keyword Type**: Keyword Exists
   - **Keyword Value**: `healthy`
3. Save

## 4. Configure Alerts

### Email Alert
1. Go to "My Settings" → "Alert Contacts"
2. Add team email addresses
3. Select "E-Mail" as alert type

### Telegram Alert (Optional)
1. Create Telegram bot via @BotFather
2. Get bot token and chat ID
3. Add alert contact:
   - **Type**: Webhook
   - **URL**: `https://api.telegram.org/bot<TOKEN>/sendMessage`
   - **POST data**: `chat_id=<CHAT_ID>&text=*UptimeRobot Alert*%0A%0AMonitor: *monitorFriendlyName*%0AStatus: *alertTypeFriendlyName*%0ADetails: *alertDetails*`

## 5. Verify Setup

1. Both monitors should show "Up" status (green)
2. Test alerts by temporarily changing keyword to something wrong
3. Verify email/Telegram notification received within 5 minutes
4. Restore correct keyword after testing
