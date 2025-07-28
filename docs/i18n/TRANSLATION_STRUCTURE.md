# 🌐 Translation Structure Documentation

**Version**: 2.0.0 - Standardized Structure  
**Last Updated**: 2025-01-26  
**Languages**: Croatian (hr-HR), English (en-US), German (de-DE)

## 📋 Overview

This document outlines the comprehensive, standardized translation structure implemented for the GS-CMS Enterprise application. The structure follows enterprise i18n best practices with feature-based namespaces, consistent naming conventions, and translator-friendly context comments.

## 🏗️ Namespace Architecture

### Core Design Principles

1. **Feature-based Organization**: Translations grouped by application features (auth, users, customers, etc.)
2. **Hierarchical Structure**: Logical nesting with clear separation of concerns
3. **Consistency**: Uniform naming conventions across all languages
4. **Context Comments**: Translator guidance prefixed with `//`
5. **Template Structure**: Scalable foundation for future features

### Namespace Hierarchy

```json
{
  "// 🔐 AUTHENTICATION & SECURITY": "User authentication and security-related content",
  "auth": {
    "signIn": { /* Sign-in specific content */ },
    "signOut": { /* Sign-out specific content */ },
    "passwordReset": { /* Password management */ },
    "errors": { /* Auth-specific errors */ }
  },

  "// 🏠 DASHBOARD": "Main dashboard content and widgets",
  "dashboard": {
    "overview": { /* Statistics and metrics */ },
    "recentActivity": { /* Activity feeds */ },
    "quickActions": { /* Quick action buttons */ },
    "charts": { /* Chart labels and legends */ }
  },

  "// 👥 USER MANAGEMENT": "User administration and profiles",
  "users": {
    "list": { /* User listing interface */ },
    "form": { /* Create/edit forms */ },
    "actions": { /* User action buttons */ },
    "status": { /* User status values */ }
  },

  "// 🏢 CUSTOMER MANAGEMENT": "Customer and client administration",
  "customers": { /* Customer management interface */ },

  "// 📋 INQUIRY MANAGEMENT": "Customer inquiries and requests",
  "inquiries": {
    "list": { /* Inquiry listing */ },
    "form": { /* Create/edit forms */ },
    "items": { /* Inquiry items management */ },
    "assignments": { /* VP assignment interface */ }
  },

  "// 💰 QUOTE MANAGEMENT": "Price quotes and proposals",
  "quotes": {
    "list": { /* Quote listing */ },
    "generation": { /* Quote generation process */ },
    "details": { /* Quote detail views */ },
    "status": { /* Quote status values */ },
    "actions": { /* Quote action buttons */ }
  },

  "// 📋 ASSIGNMENTS": "Task and workload assignments",
  "assignments": { /* Task assignment interface */ },

  "// ⚙️ AUTOMATION": "Workflow automation and rules",
  "automation": { /* Automation configuration */ },

  "// 📊 REPORTS": "Analytics and reporting system",
  "reports": { /* Reporting interface */ },

  "// 🎨 USER INTERFACE ELEMENTS": "Common UI components and navigation",
  "ui": {
    "common": { /* Universal UI elements */ },
    "navigation": { /* Menu & navigation */ },
    "buttons": { /* Button labels */ },
    "tables": { /* Table headers/content */ },
    "forms": { /* Form elements */ },
    "modals": { /* Modal dialogs */ },
    "tabs": { /* Tab navigation */ },
    "filters": { /* Search & filter UI */ }
  },

  "// 💬 MESSAGES & NOTIFICATIONS": "User feedback and system messages",
  "messages": {
    "success": { /* Success notifications */ },
    "errors": { /* Error messages */ },
    "warnings": { /* Warning messages */ },
    "info": { /* Information messages */ },
    "confirmations": { /* Confirmation dialogs */ }
  },

  "// 📝 CONTENT & DATA": "Static content and data classifications",
  "content": {
    "status": { /* Status values */ },
    "priority": { /* Priority levels */ },
    "roles": { /* User roles */ },
    "placeholders": { /* Input placeholders */ },
    "validation": { /* Form validation */ }
  },

  "// ⚙️ APPLICATION SETTINGS": "System configuration and preferences",
  "settings": {
    "profile": { /* User profile settings */ },
    "language": { /* Language preferences */ },
    "notifications": { /* Notification settings */ },
    "system": { /* System configuration */ },
    "security": { /* Security settings */ }
  },

  "// 🔧 SYSTEM & META": "System information and accessibility",
  "meta": {
    "accessibility": { /* ARIA labels and screen reader content */ },
    "tooltips": { /* Help tooltips */ },
    "timestamps": { /* Time formatting */ },
    "fileTypes": { /* File type labels */ }
  }
}
```

## 🎯 Key Naming Conventions

### Structure Rules

1. **camelCase**: All keys use camelCase formatting
2. **Descriptive Names**: Clear, self-documenting key names
3. **Consistent Patterns**: Similar elements follow same naming patterns
4. **No Abbreviations**: Use full words for clarity

### Common Patterns

```json
{
  "list": {
    "title": "Page/Section Title",
    "searchPlaceholder": "Search input placeholder",
    "noItems": "Empty state message",
    "createItem": "Create button label",
    "totalItems": "Count display with {count} parameter"
  },
  "form": {
    "create": {
      "title": "Create form title",
      "subtitle": "Create form description"
    },
    "edit": {
      "title": "Edit form title", 
      "subtitle": "Edit form description"
    },
    "fields": { /* Form field labels */ },
    "placeholders": { /* Input placeholders */ },
    "validation": { /* Validation messages */ }
  },
  "actions": { /* Action button labels */ },
  "status": { /* Status value translations */ }
}
```

## 🔤 Parameter Interpolation

### Standard Parameters

All dynamic content uses consistent parameter names:

```json
{
  "welcome": "Welcome back, {userName}!",
  "totalUsers": "{count} total users",
  "deleteConfirm": "Delete this {item}?",
  "pagination": "Showing {start} to {end} of {total}",
  "fileUpload": "Max size: {size}, formats: {formats}",
  "validation": "Must be {min} to {max} characters",
  "timestamps": "Last updated: {timestamp}"
}
```

### Parameter Naming Rules

1. **{userName}**: User display names
2. **{count}**: Numeric counts and quantities
3. **{item}**: Generic item references  
4. **{start}/{end}/{total}**: Pagination data
5. **{min}/{max}**: Validation limits
6. **{size}/{formats}**: File upload constraints
7. **{timestamp}**: Date/time displays
8. **{column}/{criteria}**: Sorting/filtering contexts

## 📝 Context Comments for Translators

### Comment Structure

```json
{
  "// Translation File: Language (locale-code)": "Context description",
  "// Version": "2.0.0 - Standardized Structure",
  "// Last Updated": "2025-01-26",
  
  "// 🔐 SECTION TITLE": "Section description for translators",
  "sectionKey": {
    "// Context": "Specific context for this subsection",
    "subKey": "Translation content"
  }
}
```

### Comment Guidelines

1. **Section Headers**: Emoji + descriptive title
2. **Context Information**: Usage scenarios and UI placement
3. **Parameter Notes**: Dynamic content explanations
4. **Cultural Notes**: Localization-specific guidance

## 🌍 Language-Specific Considerations

### Croatian (hr-HR)
- Uses Croatian special characters (čćšžđ)
- Formal addressing ("Vi" form)
- Complex plural rules (1/2-4/5+ patterns)
- EUR currency, Croatian date formats

### English (en-US)
- US English spelling and terminology
- 12-hour time format preference
- USD currency as default
- Month/Day/Year date format

### German (de-DE)
- Formal addressing ("Sie" form)
- Compound words for technical terms
- 24-hour time format preference
- EUR currency, German date formats
- Longer text strings (average 23% longer than English)

## 📊 Structure Statistics

| Metric | Value |
|--------|-------|
| **Total Lines per File** | 772 lines |
| **Main Sections** | 14 top-level namespaces |
| **Total Translation Keys** | 770+ unique keys |
| **Parameter Types** | 12 standardized parameters |
| **Language Coverage** | 100% consistent across hr/en/de |
| **Comment Coverage** | Every section documented |

## 🚀 Usage Guidelines

### For Developers

```typescript
// Import translation hook
import { useTranslations } from 'next-intl';

// Use specific namespace
const t = useTranslations('users.form.validation');
const tCommon = useTranslations('ui.common');

// Access nested translations
const errorMessage = t('emailRequired');
const saveButton = tCommon('save');

// With parameters
const welcome = useTranslations('dashboard')('welcome', { userName: 'John' });
const pagination = useTranslations('ui.tables.pagination')('showing', { 
  start: 1, end: 10, total: 100 
});
```

### For Translators

1. **Follow Parameter Format**: Keep `{parameter}` syntax intact
2. **Respect Context**: Read comment sections for usage context  
3. **Maintain Consistency**: Use consistent terminology across sections
4. **Consider Length**: German text may be 20-25% longer than English
5. **Cultural Adaptation**: Adapt to local business practices and formal addressing

## 🔧 Maintenance Guidelines

### Adding New Features

1. **Choose Appropriate Namespace**: Use existing section or create new top-level namespace
2. **Follow Naming Conventions**: Use camelCase and descriptive names
3. **Add Context Comments**: Document usage and context for translators
4. **Update All Languages**: Maintain consistency across hr/en/de files
5. **Test Parameters**: Verify dynamic content interpolation works correctly

### Quality Assurance

1. **Structure Validation**: Ensure identical JSON structure across all files
2. **Parameter Consistency**: Verify parameter names match exactly
3. **Translation Completeness**: No missing keys in any language
4. **Context Documentation**: All sections have translator comments
5. **Cultural Appropriateness**: Content adapted to local conventions

## ✅ Validation Status

**Last Validation**: 2025-01-26  
**Status**: ✅ **PERFECT STRUCTURAL ALIGNMENT**

- ✅ Identical key structure across all languages
- ✅ Complete key coverage (no missing translations)  
- ✅ Consistent parameter naming
- ✅ Proper context documentation
- ✅ No structural inconsistencies found

## 📚 Template for New Features

```json
{
  "// 🆕 NEW FEATURE": "Description of the new feature",
  "newFeature": {
    "// Context": "Specific usage context for translators",
    "list": {
      "title": "Feature Management",
      "searchPlaceholder": "Search features...",
      "noItems": "No features found", 
      "createItem": "Create New Feature",
      "totalItems": "{count} total features"
    },
    "form": {
      "create": {
        "title": "Create New Feature",
        "subtitle": "Add a new feature to the system"
      },
      "edit": {
        "title": "Edit Feature", 
        "subtitle": "Update feature information"
      },
      "fields": {
        "name": "Feature Name",
        "description": "Description",
        "isActive": "Active Status"
      },
      "placeholders": {
        "name": "Enter feature name",
        "description": "Enter description"
      },
      "validation": {
        "nameRequired": "Feature name is required",
        "descriptionRequired": "Description is required"
      }
    },
    "actions": {
      "enable": "Enable Feature",
      "disable": "Disable Feature",
      "delete": "Delete Feature"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending"
    }
  }
}
```

This template should be added to all three language files simultaneously, ensuring structural consistency is maintained.

---

**Maintained by**: Development Team  
**Review Cycle**: Monthly structure validation  
**Contact**: For translation updates or structural changes