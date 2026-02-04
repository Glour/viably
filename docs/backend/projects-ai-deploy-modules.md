# Backend Modules: Projects, AI, Deploy

**Remaining Modules:** 3  
**Status:** Not Started  
**Total Estimated Time:** 10-12 days

---

## 🎯 Module 1: PROJECTS

**Priority:** P0 | **Time:** 3-4 days | **Dependencies:** Credits, Templates

### Overview
Manages user projects (bots/APIs), CRUD operations, generation workflow, and status tracking.

### Database Model (`app/projects/models.py`)
```python
class Project(Base):
    __tablename__ = "projects"
    
    id = UUID(primary_key=True)
    user_id = UUID(ForeignKey("users.id"))
    
    # Info
    name = String(255)
    description = Text
    template_id = UUID(ForeignKey("templates.id"))
    
    # Configuration
    config = JSONB  # User inputs
    generated_code = JSONB  # {files: {path: content}}
    
    # Generation
    generation_logs = Text
    ai_model_used = String(50)  # claude-sonnet-4
    
    # Status
    status = String(20)  # draft, generating, ready, deploying, deployed, error
    error_message = Text
    
    # Deployment
    deployed_url = Text
    deploy_platform = String(50)
    
    # Visibility
    is_public = Boolean(default=False)
    
    # Timestamps
    created_at, updated_at, generated_at, deployed_at
```

### Key Endpoints (`app/projects/routes.py`)
```
GET    /api/projects              # List user projects (paginated)
POST   /api/projects              # Create new project
GET    /api/projects/{id}         # Get project details + code
PATCH  /api/projects/{id}         # Update name/description/public
DELETE /api/projects/{id}         # Delete project
POST   /api/projects/{id}/generate # Trigger AI generation
```

### Business Logic (`app/projects/service.py`)
```python
async def create_project(user_id, name, template_id, config, db)
async def get_project_by_id(project_id, user_id, db)
async def update_project(project_id, user_id, updates, db)
async def delete_project(project_id, user_id, db)
async def list_user_projects(user_id, page, per_page, status, db)
async def trigger_generation(project_id, user_id, db)  # Async task
async def save_generated_code(project_id, code_files, db)
```

### Tests (`tests/test_projects.py`)
- Create project (deducts credits)
- List projects (pagination)
- Get project (only owner)
- Update project
- Delete project
- Generate code (triggers async)
- Status transitions (draft → generating → ready)
- Error handling

---

## 🤖 Module 2: AI GENERATION

**Priority:** P0 | **Time:** 5-6 days | **Dependencies:** Projects, Templates

### Overview
Core AI engine: generates code using Claude Sonnet 4, reviews for quality, tests in sandbox, packages files.

### Components

#### 1. Anthropic Client (`app/ai/client.py`)
```python
class AnthropicClient:
    async def generate_code(prompt, model="claude-sonnet-4"):
        # Call Anthropic API
        # Return generated code
    
    async def review_code(code, context):
        # Security check, best practices
        # Return review results
```

#### 2. Prompt Builder (`app/ai/prompts.py`)
```python
def build_generation_prompt(template, user_config):
    """
    Load template.prompt_template
    Replace {{variables}} with user_config values
    Add system context about Python, aiogram, best practices
    """
    
SYSTEM_PROMPT = '''
You are a senior Python developer specializing in Telegram bots using aiogram 3.x.

Your task: Generate PRODUCTION-READY code.

Requirements:
- Clean, readable code with type hints
- Proper error handling
- Environment variables for config
- SQLite/PostgreSQL for data
- Comprehensive docstrings
- Best practices only

Output: Complete file structure with all code.
'''
```

#### 3. Generation Pipeline (`app/ai/service.py`)
```python
async def generate_project_code(project_id, db):
    """
    Complete generation workflow.
    
    Steps:
    1. Validate project status (must be draft)
    2. Check user has enough credits
    3. Deduct credits
    4. Load template + user config
    5. Build AI prompt
    6. Generate code (Claude Sonnet 4)
    7. Review code (Claude)
    8. Test in sandbox (optional)
    9. Package files
    10. Save to project.generated_code
    11. Update status → ready
    
    If error: Refund credits, set status=error
    """

async def generate_code_with_ai(prompt, model="claude-sonnet-4"):
    # Call Anthropic API
    # Parse response
    # Extract code blocks
    # Return structured files

async def review_generated_code(code_files):
    # Security scan
    # Best practices check
    # Return issues (if any)

async def test_code_in_sandbox(code_files):
    # Docker container
    # Syntax validation
    # Basic runtime test
    # Return success/fail
```

#### 4. Async Worker (`app/ai/worker.py`)
Using Celery or FastAPI BackgroundTasks:

```python
@celery.task
async def process_generation(project_id):
    async with get_db() as db:
        try:
            # Update status
            await update_project_status(project_id, "generating", db)
            
            # Generate
            result = await generate_project_code(project_id, db)
            
            # Save
            await save_generated_code(project_id, result["files"], db)
            
            # Update status
            await update_project_status(project_id, "ready", db)
            
            # Send WebSocket notification
            await notify_user(project_id, "generation_complete")
            
        except Exception as e:
            # Refund credits
            await refund_credits(project_id, db)
            
            # Update status
            await update_project_status(
                project_id,
                "error",
                error_message=str(e),
                db=db
            )
            
            # Notify user
            await notify_user(project_id, "generation_error")
```

### Key Endpoints (`app/ai/routes.py`)
```
POST /api/projects/{id}/generate  # Trigger generation (delegated from projects)
```

### Tests (`tests/test_ai.py`)
- Prompt building works
- API call successful
- Code parsing correct
- Review detects issues
- Sandbox validation
- Error handling (API failures)
- Credit refund on error

---

## 🚀 Module 3: DEPLOY

**Priority:** P1 (Should have) | **Time:** 3-4 days | **Dependencies:** Projects, AI

### Overview
Automates deployment to Railway (or other platforms), manages environment variables, tracks deployment status.

### Database Model (`app/deploy/models.py`)
```python
class Deployment(Base):
    __tablename__ = "deployments"
    
    id = UUID(primary_key=True)
    project_id = UUID(ForeignKey("projects.id"))
    
    # Platform
    platform = String(50)  # railway, render
    external_id = String(255)  # Platform deployment ID
    
    # Status
    status = String(20)  # pending, building, deploying, active, failed, stopped
    
    # URLs
    url = Text  # Public bot URL
    build_url = Text  # Platform build logs URL
    admin_url = Text  # Platform admin panel
    
    # Logs
    logs = Text
    error_message = Text
    
    # Timestamps
    created_at, updated_at, deployed_at, last_health_check
    
    # Platform data
    platform_data = JSONB  # Platform-specific metadata
```

### Railway Integration (`app/deploy/railway.py`)
```python
class RailwayClient:
    def __init__(self, api_token):
        self.token = api_token
        self.base_url = "https://backboard.railway.app/graphql"
    
    async def create_project(name, env_vars):
        # Create Railway project via GraphQL
        # Return project_id
    
    async def deploy_from_github(project_id, repo_url):
        # Connect GitHub repo
        # Trigger deployment
        # Return deployment_id
    
    async def set_env_variables(project_id, env_vars):
        # Set environment variables
    
    async def get_deployment_status(deployment_id):
        # Poll deployment status
        # Return: pending, building, active, failed
    
    async def get_deployment_url(deployment_id):
        # Get public URL
    
    async def delete_project(project_id):
        # Delete Railway project
```

### Deployment Workflow (`app/deploy/service.py`)
```python
async def deploy_project(project_id, user_id, env_vars, db):
    """
    Complete deployment workflow.
    
    Steps:
    1. Validate project (must be ready)
    2. Create temporary GitHub repo (or use Railway direct)
    3. Upload generated code
    4. Create Railway project
    5. Set environment variables
    6. Trigger deployment
    7. Poll status every 10s
    8. Update deployment record
    9. Update project.deployed_url
    10. Clean up temp repo (after 24h)
    
    Returns deployment_id
    """

async def check_deployment_health(deployment_id, db):
    # Ping deployed URL
    # Check if bot responding
    # Update last_health_check

async def stop_deployment(deployment_id, db):
    # Stop Railway project
    # Update status

async def get_deployment_logs(deployment_id):
    # Fetch from Railway API
```

### Key Endpoints (`app/deploy/routes.py`)
```
POST   /api/projects/{id}/deploy      # Deploy project
GET    /api/deployments/{id}           # Get deployment status
DELETE /api/deployments/{id}           # Stop deployment
GET    /api/deployments/{id}/logs      # Get deployment logs
```

### Tests (`tests/test_deploy.py`)
- Create Railway project
- Set environment variables
- Deploy succeeds
- Poll status works
- Health check
- Stop deployment
- Error handling (Railway API failures)

---

## 📋 IMPLEMENTATION ORDER

### Week 1: Projects Module
- Day 1-2: Models, Schemas, Service (CRUD)
- Day 3: Routes + List/Pagination
- Day 4: Tests + Integration

### Week 2: AI Generation Module
- Day 1: Anthropic client + Prompt builder
- Day 2-3: Generation pipeline + Code review
- Day 4: Async worker (Celery)
- Day 5: Tests + Integration

### Week 3: Deploy Module
- Day 1-2: Railway client + Deployment workflow
- Day 3: Status polling + Health checks
- Day 4: Tests + Integration

---

## 🔗 MODULE DEPENDENCIES

```
Templates (standalone)
    ↓
Auth → Users
    ↓
Credits
    ↓
Projects ──→ AI Generation ──→ Deploy
```

---

## 📊 SUCCESS CRITERIA

### Projects Module
- [ ] CRUD operations work
- [ ] Pagination works
- [ ] Only owner can access
- [ ] Status transitions correct
- [ ] Generation triggered

### AI Module
- [ ] Claude API integration works
- [ ] Code generation successful
- [ ] Code review functional
- [ ] Files packaged correctly
- [ ] Credits deducted/refunded
- [ ] Error handling robust

### Deploy Module
- [ ] Railway integration works
- [ ] Deployment succeeds
- [ ] Status polling accurate
- [ ] URLs returned correctly
- [ ] Can stop deployment
- [ ] Health checks work

---

## 💡 TIPS FOR IMPLEMENTATION

### For Projects:
- Use pagination for list (default 20/page)
- Filter by status (draft, ready, deployed)
- Soft delete (set deleted_at instead of DELETE)
- Include template info in GET response

### For AI:
- Use async/await everywhere
- Implement retry logic (3 attempts)
- Log all API calls for debugging
- Cache prompts templates
- Rate limit API calls

### For Deploy:
- Use webhooks from Railway (if available)
- Poll every 10s max (avoid rate limits)
- Store platform_data for debugging
- Implement health checks (ping every 5min)
- Auto-cleanup failed deployments after 24h

---

## 🎯 QUICK REFERENCE

### Projects Routes
```python
# Create with validation
POST /api/projects
{
  "name": "My Shop Bot",
  "template_id": "uuid",
  "config": {
    "shop_name": "Store",
    "products": [...]
  }
}

# Trigger generation
POST /api/projects/{id}/generate
→ Async task started
→ WebSocket updates
→ Status: draft → generating → ready
```

### AI Generation Flow
```python
1. User clicks "Generate"
2. POST /api/projects/{id}/generate
3. Backend:
   - Checks credits
   - Deducts credits
   - Queues Celery task
   - Returns 202 Accepted
4. Celery worker:
   - Builds prompt
   - Calls Claude API
   - Reviews code
   - Saves to DB
   - Updates status
   - Sends WebSocket
5. Frontend:
   - Shows progress bar
   - WebSocket updates
   - Displays code when ready
```

### Deploy Flow
```python
1. User clicks "Deploy"
2. Modal: Enter BOT_TOKEN
3. POST /api/projects/{id}/deploy
   {
     "platform": "railway",
     "env_variables": {
       "BOT_TOKEN": "123456:ABC..."
     }
   }
4. Backend:
   - Creates Railway project
   - Uploads code
   - Sets env vars
   - Triggers deploy
   - Polls status
5. Returns deployment URL
6. User gets live bot!
```

---

**Modules Status:** Ready for specification-driven implementation with Claude Code Orchestrator  
**Last Updated:** February 4, 2026
