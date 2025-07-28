# Workflow Automation Feature

## Overview
The workflow automation system has been implemented to automate repetitive tasks and streamline business processes in the GS-CMS system.

## Components Implemented

### 1. Database Schema
- **AutomationRule**: Stores rule configurations with triggers, conditions, and actions
- **AutomationLog**: Tracks all rule executions with status and timing
- **EmailTemplate**: Manages email templates for notifications
- **Deadline**: Tracks deadlines with warning and escalation dates

### 2. Automation Engine (`/src/lib/automation/`)
- **engine.ts**: Core automation engine that evaluates rules and executes actions
- **types.ts**: TypeScript interfaces and enums for type safety
- **email-service.ts**: Email notification service with template support
- **deadline-service.ts**: Deadline tracking and reminder system
- **cron-jobs.ts**: Background job scheduler for periodic tasks
- **hooks.ts**: Integration hooks for existing business logic

### 3. Available Triggers
- `INQUIRY_CREATED`: When a new inquiry is created
- `INQUIRY_STATUS_CHANGED`: When inquiry status changes
- `ITEM_ASSIGNED`: When an item is assigned to a user
- `COST_CALCULATED`: When cost calculation is completed
- `APPROVAL_REQUIRED`: When approval is needed
- `QUOTE_CREATED`: When a quote is generated
- `DEADLINE_APPROACHING`: When deadlines are near
- `WORKLOAD_THRESHOLD`: For workload balancing
- `PRODUCTION_ORDER_CREATED`: When production order is created

### 4. Available Actions
- **ASSIGN_TO_USER**: Assign entity to specific user
- **ASSIGN_TO_ROLE**: Assign to role with optional workload balancing
- **SEND_EMAIL**: Send templated email notifications
- **CREATE_NOTIFICATION**: Create in-app notifications
- **UPDATE_STATUS**: Change entity status
- **CREATE_DEADLINE**: Set deadlines with reminders
- **ESCALATE**: Escalate to managers
- **CREATE_TASK**: Create follow-up tasks
- **TRIGGER_WEBHOOK**: Call external services

### 5. UI Components
- **Rule List Page** (`/dashboard/automation`): View and manage all rules
- **Create Rule Page** (`/dashboard/automation/new`): Create new rules
- **Edit Rule Page** (`/dashboard/automation/[ruleId]`): Edit existing rules
- **Rule Form Component**: Reusable form for rule configuration

### 6. API Endpoints
- `GET /api/automation/rules`: List all rules
- `POST /api/automation/rules`: Create new rule
- `GET /api/automation/rules/[ruleId]`: Get single rule
- `PATCH /api/automation/rules/[ruleId]`: Update rule
- `DELETE /api/automation/rules/[ruleId]`: Delete rule

## Features

### Condition Evaluation
- Multiple conditions with AND/OR logic
- Field-based comparisons (equals, contains, greater than, etc.)
- Nested field access (e.g., `inquiry.customer.name`)

### Workload Balancing
- Automatic assignment to least busy user in role
- Considers active items and pending calculations
- Ensures fair distribution of work

### Email Notifications
- Template-based system with variable substitution
- Default templates for common scenarios
- Fallback to console logging if email not configured

### Deadline Management
- Automatic reminder emails
- Escalation for overdue items
- Integration with automation rules

### Execution Logging
- All rule executions are logged
- Success/failure tracking
- Performance metrics (execution time)

## Usage Example

### Creating a Rule: Auto-assign new inquiries to VPP
1. Navigate to Dashboard > Automation
2. Click "Create Rule"
3. Configure:
   - Name: "Auto-assign High Priority Inquiries"
   - Trigger: "Inquiry Created"
   - Conditions: 
     - Field: `inquiry.priority`
     - Operator: `equals`
     - Value: `HIGH`
   - Actions:
     - Type: "Assign to Role"
     - Role: "VPP"
     - Balance Workload: true
4. Save and activate

### Email Configuration
Add to `.env`:
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@gs-cms.com
```

### Enabling Cron Jobs
Add to `.env`:
```env
ENABLE_CRON=true
```

## Security Considerations
- Only ADMIN and SUPERUSER roles can manage automation rules
- Only SUPERUSER can delete rules
- All actions are logged for audit purposes
- Email templates are sanitized to prevent injection

## Next Steps
1. Test automation rules in production
2. Add more email templates
3. Implement webhook action
4. Add bulk operation support
5. Create automation analytics dashboard