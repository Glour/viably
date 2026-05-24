#!/bin/bash
# Telegram Webhook Helper for UptimeRobot
# Usage: ./scripts/telegram-webhook-helper.sh <BOT_TOKEN>

BOT_TOKEN="$1"
CHAT_ID="5070953585"  # @ne_stoit_togo

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Error: Bot token required"
    echo ""
    echo "Usage: $0 <BOT_TOKEN>"
    echo ""
    echo "Steps:"
    echo "1. Open @BotFather in Telegram"
    echo "2. Send: /newbot"
    echo "3. Name: Viably Monitor Bot"
    echo "4. Username: viably_monitor_bot (or any available)"
    echo "5. Copy the bot token"
    echo "6. Run: $0 <BOT_TOKEN>"
    exit 1
fi

echo "🤖 Telegram Webhook Setup Helper"
echo "================================="
echo ""
echo "Bot Token: ${BOT_TOKEN:0:10}...${BOT_TOKEN: -5}"
echo "Chat ID: $CHAT_ID"
echo ""

# Test bot token
echo "📡 Testing bot token..."
RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$RESPONSE" | jq -r '.result.username')
    echo "✅ Bot token valid: @$BOT_USERNAME"
else
    echo "❌ Invalid bot token"
    echo "$RESPONSE"
    exit 1
fi

echo ""

# Send test message
echo "📤 Sending test message to chat $CHAT_ID..."
TEST_MESSAGE="🟢 Viably Monitor Bot activated!

This is a test message. Your monitoring alerts will arrive here.

Setup: $(date)"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_id\": \"$CHAT_ID\",
        \"text\": \"$TEST_MESSAGE\",
        \"parse_mode\": \"Markdown\"
    }" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Test message sent! Check Telegram."
else
    echo "❌ Failed to send message"
    echo "   Make sure you've started the bot: Open @$BOT_USERNAME and send /start"
    exit 1
fi

echo ""
echo "================================="
echo "🎯 UptimeRobot Webhook Setup"
echo "================================="
echo ""
echo "1. Open UptimeRobot: https://uptimerobot.com"
echo "2. Go to: My Settings → Alert Contacts → Add Alert Contact"
echo "3. Select: Webhook"
echo "4. Configure:"
echo ""
echo "   Friendly Name:"
echo "   Telegram - Viably Alerts"
echo ""
echo "   URL to Notify:"
echo "   https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"
echo ""
echo "   POST Value (select 'Send as JSON'):"
cat <<EOF
{
  "chat_id": "$CHAT_ID",
  "text": "🔴 *Alert from Viably*\n\n*Monitor:* *monitorFriendlyName*\n*Status:* *alertTypeFriendlyName*\n*URL:* *monitorURL*\n*Time:* *alertDateTime*\n*Reason:* *alertDetails*",
  "parse_mode": "Markdown"
}
EOF
echo ""
echo "   Custom HTTP Headers:"
echo "   Content-Type: application/json"
echo ""
echo "5. Click 'Test Alert Contact'"
echo "6. Check Telegram for test message"
echo "7. Save Alert Contact"
echo ""
echo "================================="
echo "📋 Alternative: Sentry Integration"
echo "================================="
echo ""
echo "You can also receive Sentry errors in Telegram:"
echo ""
echo "1. Open Sentry: https://sentry.io"
echo "2. Go to: Settings → Integrations"
echo "3. Search: Telegram"
echo "4. Install and configure:"
echo "   - Bot Token: $BOT_TOKEN"
echo "   - Chat ID: $CHAT_ID"
echo ""
echo "================================="
echo "✅ Setup complete!"
echo "================================="
echo ""
echo "Save this info:"
echo "- Bot Username: @$BOT_USERNAME"
echo "- Bot Token: $BOT_TOKEN"
echo "- Chat ID: $CHAT_ID"
echo ""
echo "Test the webhook by triggering a monitor alert in UptimeRobot."
echo ""
