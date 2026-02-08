# Email Template Integration Guide

Guide for integrating React Email templates with the backend email service.

## Backend Integration

### 1. Install Dependencies (Backend)

The backend needs to render React Email templates to HTML. Add to `backend/requirements.txt`:

```txt
# Option 1: Use Node.js from Python (recommended)
nodejs-bin>=18.0.0

# Option 2: Pre-render templates to static HTML (simpler)
# No additional dependencies needed
```

### 2. Rendering Approach

**Option A: Node.js Subprocess (Recommended)**

Render templates on-the-fly using Node.js from Python:

```python
# backend/app/services/email_renderer.py
import subprocess
import json
from pathlib import Path
from typing import Dict, Any

class EmailRenderer:
    """Renders React Email templates to HTML using Node.js"""

    def __init__(self, templates_dir: str = "../frontend/emails"):
        self.templates_dir = Path(templates_dir).resolve()

    def render_template(self, template_name: str, props: Dict[str, Any]) -> tuple[str, str]:
        """
        Render email template to HTML and plain text.

        Args:
            template_name: Template name (e.g., 'welcome')
            props: Template props as dictionary

        Returns:
            Tuple of (html, text)
        """
        script = f"""
        const {{ render }} = require('@react-email/render');
        const Template = require('./emails/{template_name}').default;

        const props = {json.dumps(props)};
        const html = render(Template(props));
        const text = render(Template(props), {{ plainText: true }});

        console.log(JSON.stringify({{ html, text }}));
        """

        result = subprocess.run(
            ['node', '-e', script],
            cwd=self.templates_dir.parent,
            capture_output=True,
            text=True,
            check=True
        )

        output = json.loads(result.stdout)
        return output['html'], output['text']


# Usage in email service
from app.services.email_renderer import EmailRenderer

renderer = EmailRenderer()

async def send_welcome_email(user):
    html, text = renderer.render_template(
        'welcome',
        {
            'userName': user.full_name,
            'userEmail': user.email,
            'credits': 100,
            'dashboardUrl': 'https://viably.dev/dashboard'
        }
    )

    await email_service.send_email(
        to=user.email,
        subject='Welcome to Viably!',
        html=html,
        text=text
    )
```

**Option B: Pre-rendered Static HTML (Simpler)**

Export templates to static HTML during build:

```bash
# Build static HTML templates
cd frontend
npx react-email export --outDir ../backend/app/templates/emails

# This creates HTML files in backend/app/templates/emails/
# - welcome.html
# - generation-complete.html
# - deploy-success.html
```

Then use Python templating to replace variables:

```python
# backend/app/services/email_service.py
from jinja2 import Template
from pathlib import Path

class EmailService:
    def __init__(self):
        self.templates_dir = Path(__file__).parent.parent / "templates" / "emails"

    def render_welcome_email(self, user) -> str:
        """Render welcome email with user data"""
        template_path = self.templates_dir / "welcome.html"
        template = Template(template_path.read_text())

        return template.render(
            userName=user.full_name,
            userEmail=user.email,
            credits=100,
            dashboardUrl="https://viably.dev/dashboard"
        )
```

## Recommended Workflow

### Development

1. **Design emails in React Email:**
   ```bash
   cd frontend
   npx react-email dev
   # Open http://localhost:3000
   ```

2. **Test rendering:**
   ```bash
   # Export to HTML
   npx react-email export --outDir .email-preview
   ```

3. **Preview in real email client:**
   - Use [Mailtrap](https://mailtrap.io/) for testing
   - Send test emails to real accounts

### Production

1. **Build step (CI/CD):**
   ```bash
   # In frontend directory
   npx react-email export --outDir ../backend/app/templates/emails
   ```

2. **Backend sends emails:**
   ```python
   await email_service.send_welcome_email(user)
   ```

## Email Service Integration

Update the existing `EmailService` class:

```python
# backend/app/services/email_service.py
from typing import Optional
from pathlib import Path
from jinja2 import Template

class EmailService:
    """
    Email service with React Email template support
    """

    def __init__(
        self,
        templates_dir: Optional[Path] = None,
        use_react_templates: bool = True
    ):
        self.templates_dir = templates_dir or (
            Path(__file__).parent.parent / "templates" / "emails"
        )
        self.use_react_templates = use_react_templates

    async def send_welcome_email(
        self,
        to: str,
        user_name: str,
        credits: int = 100
    ) -> bool:
        """Send welcome email to new user"""

        if self.use_react_templates:
            html_content = self._render_react_template(
                "welcome",
                {
                    "userName": user_name,
                    "userEmail": to,
                    "credits": credits,
                    "dashboardUrl": f"{settings.FRONTEND_URL}/dashboard"
                }
            )
        else:
            # Fallback to simple template
            html_content = self._render_simple_template("welcome", {...})

        return await self.send_email(
            to=to,
            subject="Welcome to Viably! 🎉",
            html=html_content,
            category="welcome"
        )

    def _render_react_template(self, template_name: str, props: dict) -> str:
        """Render React Email template (pre-built HTML)"""
        template_path = self.templates_dir / f"{template_name}.html"

        if not template_path.exists():
            raise FileNotFoundError(
                f"Email template not found: {template_path}\n"
                "Run: cd frontend && npx react-email export --outDir ../backend/app/templates/emails"
            )

        template = Template(template_path.read_text())
        return template.render(**props)
```

## Environment Variables

Add to `backend/.env`:

```bash
# Email settings
FRONTEND_URL=https://viably.dev
EMAIL_FROM=noreply@viably.dev
EMAIL_FROM_NAME=Viably

# React Email templates
USE_REACT_EMAIL_TEMPLATES=true
REACT_EMAIL_TEMPLATES_DIR=app/templates/emails
```

## Testing

### Unit Tests

```python
# backend/tests/test_email_service.py
import pytest
from app.services.email_service import EmailService

@pytest.fixture
def email_service():
    return EmailService(use_react_templates=True)

async def test_send_welcome_email(email_service, test_user):
    """Test welcome email sends successfully"""

    result = await email_service.send_welcome_email(
        to=test_user.email,
        user_name=test_user.full_name,
        credits=100
    )

    assert result is True
    # Verify email was sent (check email service mock)

def test_render_welcome_template(email_service):
    """Test welcome template renders correctly"""

    html = email_service._render_react_template(
        "welcome",
        {
            "userName": "Test User",
            "userEmail": "test@example.com",
            "credits": 100,
            "dashboardUrl": "https://viably.dev/dashboard"
        }
    )

    assert "Welcome to Viably, Test User!" in html
    assert "100" in html  # Credits
    assert "Go to Dashboard" in html
```

### Integration Tests

```python
# backend/tests/integration/test_email_flow.py
import pytest
from app.models.user import User
from app.services.email_service import EmailService

@pytest.mark.integration
async def test_user_registration_sends_welcome_email(client, db_session):
    """Test that user registration triggers welcome email"""

    # Register new user
    response = await client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "full_name": "New User"
    })

    assert response.status_code == 201

    # Verify welcome email was sent
    # (Check email service logs or mock)
```

## Deployment Checklist

- [ ] Export React Email templates to static HTML
- [ ] Copy HTML files to backend templates directory
- [ ] Update EmailService to use React templates
- [ ] Configure environment variables
- [ ] Test emails in staging environment
- [ ] Verify emails render correctly in:
  - [ ] Gmail (web, mobile)
  - [ ] Outlook (desktop, web)
  - [ ] Apple Mail
  - [ ] Yahoo Mail
- [ ] Set up email monitoring (delivery rates, bounces)
- [ ] Configure unsubscribe links
- [ ] Add email logging to track sends

## Monitoring

Track email metrics:

```python
# backend/app/models/email_log.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.db.base import Base

class EmailLog(Base):
    """Log all sent emails for monitoring"""

    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True)
    recipient = Column(String, nullable=False)
    template = Column(String, nullable=False)  # 'welcome', 'generation-complete', etc.
    subject = Column(String, nullable=False)
    status = Column(String, nullable=False)  # 'sent', 'failed', 'bounced'
    error_message = Column(String, nullable=True)
    sent_at = Column(DateTime, nullable=False)
    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
```

## Troubleshooting

### Templates Not Found

```bash
# Export templates from frontend
cd frontend
npx react-email export --outDir ../backend/app/templates/emails

# Verify files exist
ls ../backend/app/templates/emails/
```

### Styling Issues

- Ensure all styles are inline (React Email handles this)
- Test in multiple email clients
- Use [Litmus](https://litmus.com/) or [Email on Acid](https://emailonacid.com/) for testing

### Variable Replacement

If using Jinja2, update exported HTML to use template syntax:

```html
<!-- Before (React Email output) -->
<h1>Welcome to Viably, Alex!</h1>

<!-- After (Jinja2 template) -->
<h1>Welcome to Viably, {{ userName }}!</h1>
```

Or use a post-processing script to add Jinja2 placeholders.

## Resources

- [React Email Documentation](https://react.email/)
- [Sending Emails with FastAPI](https://fastapi.tiangolo.com/advanced/templates/)
- [Mailtrap - Email Testing](https://mailtrap.io/)
- [Email Client CSS Support](https://www.caniemail.com/)
