# Email Service Integration

Complete email sending system with React Email templates, Celery task queue, and automatic fallbacks.

## Architecture

```
┌─────────────────────┐
│   FastAPI Route     │
│  (auth/routes.py)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Celery Task       │
│ send_template_email │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  EmailService       │
│ (emails/service.py) │
└──────────┬──────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
┌──────────────────────┐    ┌────────────────────────┐
│ EmailTemplateRenderer│    │   Resend API           │
│ (React Email or      │    │ (Email Delivery)       │
│  Fallback HTML)      │    │                        │
└──────────────────────┘    └────────────────────────┘
           │
           ▼
┌──────────────────────┐
│     EmailLog         │
│   (Database)         │
└──────────────────────┘
```

## Features Implemented

### T036-T037: Email Template Rendering

**Files:**
- `backend/app/emails/template_renderer.py` - React Email template renderer via Node.js
- `backend/app/emails/template_fallback.py` - Fallback HTML templates
- `backend/scripts/render_email.js` - Node.js script to render React Email templates
- `backend/app/emails/service.py` - Updated with `send_template_email()` method

**How it works:**
1. Python calls Node.js script to render React Email template from `frontend/emails/`
2. If Node.js fails, uses fallback HTML templates (same design, simpler)
3. Rendered HTML is sent via Resend API
4. All emails logged to database

**Available Templates:**
- `welcome` - New user welcome email
- `generation-complete` - AI generation completion notification
- `deploy-success` - Deployment success confirmation
- `low-credits` - Credit balance warning

### T038: Welcome Email on Registration

**Files:**
- `backend/app/auth/routes.py` - `/register` endpoint updated

**Trigger:** User successfully registers
**Props:**
- `userName` - User's full name or email username
- `userEmail` - User's email address
- `credits` - Starting credit balance (100)
- `dashboardUrl` - Link to dashboard

**Example:**
```python
send_template_email_task.delay(
    template_name="welcome",
    email_type="welcome",
    recipient=user.email,
    subject="Welcome to Viably - Your Account is Ready! 🎉",
    template_props={
        "userName": "Alex",
        "userEmail": "alex@example.com",
        "credits": 100,
        "dashboardUrl": "https://viably.dev/dashboard",
    },
    user_id=str(user.id),
)
```

### T039: Generation Complete Email

**Files:**
- `backend/app/ai/service.py` - `AIGenerationService.generate_project_code()` updated

**Trigger:** AI code generation completes successfully
**Props:**
- `userName` - User's name
- `projectName` - Generated project name
- `templateUsed` - Template name (e.g., "Discord Bot Starter")
- `generatedAt` - ISO timestamp
- `projectUrl` - Link to project page
- `creditsUsed` - Credits deducted (10)
- `creditsRemaining` - User's remaining credits

### T040: Deploy Success Email

**Files:**
- `backend/app/deploy/service.py` - `DeploymentService.deploy_project()` updated

**Trigger:** Bot deployment completes successfully
**Props:**
- `userName` - User's name
- `projectName` - Deployed project name
- `deploymentUrl` - Live deployment URL
- `platform` - Platform name (Railway, Discord, etc.)
- `deployedAt` - ISO timestamp
- `projectUrl` - Link to project dashboard

### T041: Low Credits Warning

**Files:**
- `backend/app/celery_tasks/email_tasks.py` - `check_low_credits_task()` added

**Trigger:** Celery Beat daily job (10 AM UTC)
**Logic:**
1. Query all active users with `credits < 20 AND credits > 0`
2. Check if warning sent in last 7 days (avoid spam)
3. Send warning email via Celery task
4. Log to EmailLog

**Props:**
- `userName` - User's name
- `currentCredits` - Current balance
- `threshold` - Warning threshold (20)
- `dashboardUrl` - Link to dashboard
- `buyCreditsUrl` - Link to credits purchase page

**Celery Beat Schedule:**
```python
celery_app.conf.beat_schedule = {
    'check-low-credits-daily': {
        'task': 'check_low_credits',
        'schedule': crontab(hour=10, minute=0),  # 10 AM UTC daily
    },
}
```

### T042: Test Email Endpoint

**Files:**
- `backend/app/emails/routes.py` - `/api/v1/emails/test-send` endpoint added

**Usage:**
```bash
POST /api/v1/emails/test-send
Authorization: Bearer <token>
Content-Type: application/json

{
  "template_name": "welcome",
  "recipient": "test@example.com",
  "template_props": {
    "userName": "Test User"
  }
}
```

**Response:**
```json
{
  "data": {
    "message": "Test email queued successfully",
    "template": "welcome",
    "recipient": "test@example.com",
    "task_id": "abc-123",
    "available_templates": ["welcome", "generation-complete", "deploy-success", "low-credits"]
  }
}
```

**Features:**
- Lists available templates
- Provides default props for each template
- Allows prop overrides for testing
- Returns Celery task ID for tracking
- Rate limited (5 requests/minute)

## Celery Tasks

### Email Sending Tasks

**`send_template_email_task`** - Render and send email
- Max retries: 3
- Retry delay: 60s (exponential backoff)
- Logs all attempts and errors

**`send_email_task`** - Send pre-rendered HTML email (legacy)
- Same retry logic as above

### Periodic Tasks

**`check_low_credits_task`** - Daily credit check
- Schedule: Daily at 10 AM UTC
- Checks users with credits < 20
- Prevents duplicate warnings (7-day cooldown)

**`retry_failed_emails_task`** - Hourly failed email retry
- Schedule: Every hour
- Finds failed emails from last 24 hours
- Re-queues for sending
- Limits: 100 emails per run

## Running the Services

### Start Celery Worker
```bash
cd backend
celery -A app.celery_tasks.email_tasks worker --loglevel=info
```

### Start Celery Beat (Scheduler)
```bash
cd backend
celery -A app.celery_tasks.email_tasks beat --loglevel=info
```

### Run Both Together
```bash
cd backend
celery -A app.celery_tasks.email_tasks worker --beat --loglevel=info
```

## Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxx  # Resend API key for email sending

# Optional
CELERY_BROKER_URL=redis://localhost:6379/0  # Redis for task queue
CELERY_RESULT_BACKEND=redis://localhost:6379/0  # Redis for results
CORS_ORIGINS=https://viably.dev  # Frontend URL for email links
```

### Email Template Development

1. **Create React Email Template** (`frontend/emails/`)
   ```tsx
   // frontend/emails/my-template.tsx
   export interface MyTemplateProps {
     userName: string;
     // ... other props
   }

   export default function MyTemplate({ userName }: MyTemplateProps) {
     return (
       <Html>
         <Body>
           <Text>Hello {userName}!</Text>
         </Body>
       </Html>
     );
   }
   ```

2. **Add Fallback Template** (`backend/app/emails/template_fallback.py`)
   ```python
   def render_my_template_fallback(props: dict[str, Any]) -> str:
       user_name = props.get("userName", "User")
       return f"""
       <!DOCTYPE html>
       <html>
         <body>
           <p>Hello {user_name}!</p>
         </body>
       </html>
       """

   FALLBACK_TEMPLATES["my-template"] = render_my_template_fallback
   ```

3. **Export Template** (`frontend/emails/index.ts`)
   ```typescript
   export { default as MyTemplate } from './my-template'
   export type { MyTemplateProps } from './my-template'
   ```

4. **Use in Code**
   ```python
   from app.celery_tasks.email_tasks import send_template_email_task

   send_template_email_task.delay(
       template_name="my-template",
       email_type="my_template",
       recipient="user@example.com",
       subject="My Subject",
       template_props={"userName": "Alex"},
       user_id=str(user_id),
   )
   ```

## Testing

### Test Email Sending (via API)
```bash
curl -X POST http://localhost:8000/api/v1/emails/test-send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "welcome",
    "recipient": "test@example.com",
    "template_props": {}
  }'
```

### Test Template Rendering (Python)
```python
from app.emails.template_renderer import EmailTemplateRenderer

renderer = EmailTemplateRenderer()
html = await renderer.render_template(
    'welcome',
    {'userName': 'Test', 'credits': 100, 'dashboardUrl': 'https://viably.dev'}
)
print(html)
```

### Check Email Logs
```bash
curl http://localhost:8000/api/v1/emails/logs \
  -H "Authorization: Bearer <token>"
```

## Monitoring

### Email Log Database Schema
```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_variables JSONB,
    status VARCHAR(20) NOT NULL,  -- pending, sent, failed
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Metrics to Monitor
- Email send success rate (`status='sent'` / total)
- Average send time (measure Celery task duration)
- Failed email count by type
- Low credits warning delivery rate
- Template rendering failures (Node.js vs fallback usage)

## Troubleshooting

### Emails Not Sending

**1. Check Celery Worker is Running**
```bash
ps aux | grep celery
```

**2. Check Redis Connection**
```bash
redis-cli ping
```

**3. Check Resend API Key**
```bash
echo $RESEND_API_KEY
```

**4. Check Email Logs**
```sql
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Template Rendering Fails

**1. Check Node.js is Installed**
```bash
node --version  # Should be 14+
```

**2. Check Frontend Dependencies**
```bash
cd frontend
npm list @react-email/render
```

**3. Check Fallback Templates**
If Node.js fails, fallback templates should work. Check logs for fallback usage.

### Low Credits Task Not Running

**1. Check Celery Beat is Running**
```bash
ps aux | grep celery.*beat
```

**2. Check Beat Schedule**
```python
from app.celery_tasks.email_tasks import celery_app
print(celery_app.conf.beat_schedule)
```

**3. Manually Trigger Task**
```python
from app.celery_tasks.email_tasks import check_low_credits_task
result = check_low_credits_task.delay()
```

## Security Considerations

1. **Email Injection**: All props are escaped in templates
2. **Rate Limiting**: All endpoints have rate limits (5-30 req/min)
3. **Authentication**: All email operations require valid JWT
4. **Sensitive Data**: No passwords or tokens in email logs
5. **API Keys**: RESEND_API_KEY stored in environment, never logged
6. **SSRF Prevention**: No user-provided URLs in email rendering

## Future Enhancements

- [ ] Email preferences management (allow users to opt-out)
- [ ] A/B testing for email templates
- [ ] Email analytics (open rates, click rates)
- [ ] Template preview API endpoint
- [ ] Batch email sending for announcements
- [ ] Custom email templates per user tier
- [ ] Email queueing priority system
- [ ] Webhook integration for email events (Resend webhooks)
