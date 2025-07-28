# 🌐 Translation Template & Standards Guide

**Version:** 3.0.0  
**Last Updated:** 2025-01-26  
**Purpose:** Standardized template for adding new translation keys

## 📁 File Structure

```
messages/
├── en.json     # English (US) - Primary language
├── hr.json     # Croatian - Default locale
├── de.json     # German
└── [locale].json # Future languages
```

## 🎯 Key Naming Convention

### Standard Pattern
```
namespace.component.context.action
```

### Examples
```json
{
  "users.form.create.title": "Create New User",
  "inquiries.table.actions.view": "View Inquiry", 
  "automation.rules.validation.nameRequired": "Rule name is required"
}
```

## 📚 Namespace Organization

### Core Namespaces
- **`common`** - Shared UI elements, generic terms
- **`navigation`** - Menu items, navigation links
- **`auth`** - Authentication, session management
- **`pages`** - Page titles, main headings
- **`roles`** - User roles and permissions
- **`buttons`** - Button labels and actions
- **`forms`** - Form labels, placeholders, validation
- **`tables`** - Table headers and data display
- **`messages`** - Toast notifications, feedback

### Feature Namespaces
- **`users`** - User management
- **`inquiries`** - Customer inquiry management
- **`automation`** - Workflow automation
- **`attachments`** - File upload and management
- **`excel`** - Export functionality
- **`settings`** - Application preferences

## 🏗️ New Feature Template

When adding a new feature, create keys following this structure:

```json
{
  "newFeature": {
    "_context": "Brief description of the feature for translators",
    
    "list": {
      "title": "Feature List Title",
      "noItems": "No items found",
      "searchPlaceholder": "Search items...",
      "count": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
    },
    
    "form": {
      "create": {
        "title": "Create New Item",
        "subtitle": "Add a new item to the system"
      },
      "edit": {
        "title": "Edit Item", 
        "subtitle": "Update item information"
      },
      "fields": {
        "name": "Item Name",
        "description": "Description",
        "status": "Status"
      },
      "validation": {
        "nameRequired": "Name is required",
        "emailInvalid": "Please enter a valid email"
      }
    },
    
    "actions": {
      "create": "Create Item",
      "edit": "Edit Item",
      "delete": "Delete Item",
      "view": "View Item"
    },
    
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending"
    },
    
    "messages": {
      "created": "Item created successfully",
      "updated": "Item updated successfully", 
      "deleted": "Item deleted successfully",
      "loadFailed": "Failed to load items",
      "confirmDelete": "Are you sure you want to delete this item?"
    }
  }
}
```

## 🔤 Language-Specific Guidelines

### Croatian (hr-HR)
- Use formal address forms ("Vi" instead of "ti")
- Implement proper case endings for numbers
- Include Croatian special characters: č, ć, š, ž, đ
- Use Croatian technical terminology where appropriate

**Pluralization Pattern:**
```json
{
  "count": "{count, plural, =0 {Nema stavki} =1 {1 stavka} one {# stavka} few {# stavke} other {# stavki}}"
}
```

### German (de-DE)
- Use formal address ("Sie" instead of "du") 
- Consider compound words and longer text length (+20-30%)
- Implement proper capitalization for nouns
- Use gender-neutral language where possible

**Pluralization Pattern:**
```json
{
  "count": "{count, plural, =0 {Keine Elemente} =1 {1 Element} other {# Elemente}}"
}
```

### English (en-US)
- Use clear, professional language
- Maintain consistent terminology
- Follow sentence case for UI elements
- Use American spelling conventions

**Pluralization Pattern:**
```json
{
  "count": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

## 🎨 Context Comments

Add translator context using `_context` keys:

```json
{
  "featureName": {
    "_context": "Brief description of feature/component for translators",
    "section": {
      "_context": "Specific context for this section if needed"
    }
  }
}
```

## 📝 ICU MessageFormat Examples

### Parameter Interpolation
```json
{
  "welcome": "Welcome back, {userName}!",
  "uploadedBy": "Uploaded by {name} on {date}",
  "resetPassword": "Password reset for {userName}"
}
```

### Pluralization
```json
{
  "fileCount": "You have {count, plural, =0 {no files} =1 {one file} other {# files}}",
  "itemsSelected": "{count, plural, =0 {None selected} =1 {1 item selected} other {# items selected}}"
}
```

### Date and Number Formatting
```json
{
  "lastLogin": "Last login: {date, date, medium}",
  "price": "Price: {amount, number, currency}",
  "percentage": "Progress: {value, number, percent}"
}
```

## ✅ Translation Checklist

Before adding new translations:

- [ ] Follow namespace.component.context.action naming
- [ ] Add `_context` comments for translators
- [ ] Implement proper pluralization for all languages
- [ ] Use parameter interpolation for dynamic content
- [ ] Test longer German text for layout issues
- [ ] Verify Croatian special characters display correctly
- [ ] Ensure consistent terminology across features
- [ ] Add keys to all three language files (en, hr, de)

## 🚀 Implementation Steps

1. **Plan Translation Keys**
   - Map out all user-facing text
   - Follow naming conventions
   - Organize by feature hierarchy

2. **Create English Template**
   - Add keys to `en.json` first
   - Include ICU formatting for dynamic content
   - Add translator context comments

3. **Translate to Other Languages**
   - Maintain key structure consistency
   - Adapt pluralization rules per language
   - Consider cultural and linguistic differences

4. **Test Implementation**
   - Verify all keys display correctly
   - Test layout with longer German text
   - Validate pluralization with different counts
   - Check special character rendering

5. **Update Components**
   - Replace hardcoded strings with `t()` calls
   - Test language switching functionality
   - Verify fallback behavior

## 📋 Maintenance Guidelines

- **Monthly Review**: Check for missing keys and inconsistencies
- **Version Control**: Update version numbers in `_metadata`
- **Documentation**: Keep this template updated with new patterns
- **Testing**: Regular testing across all supported languages
- **Consistency**: Maintain terminology glossary for technical terms

## 🔗 Related Files

- `/src/i18n/request.ts` - i18n configuration
- `/src/lib/locale.ts` - Locale utilities
- `/bugs.md` - Known i18n issues
- Component files using `useTranslations()` hook

---

*This template ensures consistent, maintainable, and scalable internationalization across the GS-CMS application.*