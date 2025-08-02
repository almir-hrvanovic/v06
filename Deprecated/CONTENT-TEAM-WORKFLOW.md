# Content Team i18n Workflow Guide

**Target Audience**: Content creators, translators, copywriters, and non-technical team members  
**Project**: GS-CMS Enterprise v05  
**Languages**: Croatian (hr), Bosnian (bs), English (en), German (de)

## 🎯 Overview

This guide helps content team members work with translations in the GS-CMS system. You'll learn how to add, update, and maintain translations without needing technical knowledge.

## 🌍 Language Structure

### Supported Languages
- **English (en)** - Base language, all keys must exist here first
- **Croatian (hr)** - Primary Balkan language  
- **Bosnian (bs)** - Falls back to Croatian, then English
- **German (de)** - Independent, falls back to English

### Language Priorities
```
German (de) → English (en)
Croatian (hr) → English (en)  
Bosnian (bs) → Croatian (hr) → English (en)
```

## 📁 Where to Find Translation Files

All translation files are located in the `messages/` folder:
```
messages/
├── en.json    (English - Base Language)
├── hr.json    (Croatian)
├── bs.json    (Bosnian)  
└── de.json    (German)
```

## 🔑 Understanding Translation Keys

### Key Structure
Translation keys use a hierarchical dot notation:

```json
{
  "category": {
    "subcategory": {
      "keyName": "Actual text to display"
    }
  }
}
```

### Example Structure
```json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete"
    },
    "status": {
      "loading": "Loading...",
      "error": "An error occurred"
    }
  },
  "forms": {
    "validation": {
      "required": "This field is required",
      "email": "Please enter a valid email"
    },
    "labels": {
      "firstName": "First Name",
      "lastName": "Last Name"
    }
  }
}
```

### Key Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `common.*` | Shared UI elements | Save, Cancel, Loading |
| `forms.*` | Form elements | Labels, validation messages |
| `pages.*` | Page-specific content | Titles, descriptions |
| `navigation.*` | Menu and navigation | Dashboard, Users, Settings |
| `auth.*` | Authentication | Sign in, Sign out, Password |
| `emptyStates.*` | Empty states | No data found, Try again |

## ✏️ Adding New Translations

### Step 1: Add to English (Base Language)
Always start with the English file (`messages/en.json`):

```json
{
  "users": {
    "actions": {
      "createUser": "Create New User",
      "inviteUser": "Invite User"
    }
  }
}
```

### Step 2: Add to Other Languages
Copy the same structure to all other language files:

**Croatian (messages/hr.json):**
```json
{
  "users": {
    "actions": {
      "createUser": "Stvori Novog Korisnika",
      "inviteUser": "Pozovi Korisnika"
    }
  }
}
```

**Bosnian (messages/bs.json):**
```json
{
  "users": {
    "actions": {
      "createUser": "Kreiraj Novog Korisnika", 
      "inviteUser": "Pozovi Korisnika"
    }
  }
}
```

**German (messages/de.json):**
```json
{
  "users": {
    "actions": {
      "createUser": "Neuen Benutzer Erstellen",
      "inviteUser": "Benutzer Einladen"
    }
  }
}
```

## 🔄 Workflow Process

### For New Content

1. **Request from Developer**
   - Developer identifies needed translation keys
   - Provides English text and context
   - Specifies key path (e.g., `forms.labels.companyName`)

2. **Content Team Action**
   - Add English text to `messages/en.json`
   - Translate to Croatian in `messages/hr.json`
   - Translate to Bosnian in `messages/bs.json`
   - Translate to German in `messages/de.json`

3. **Quality Check**
   - Verify all 4 files have the same key structure
   - Check text fits in UI (especially German - often longer)
   - Ensure consistent terminology

4. **Developer Integration**
   - Developer tests all languages
   - Verifies text displays correctly
   - Checks for layout issues

### For Updates/Changes

1. **Change Request**
   - Identify which keys need updating
   - Provide new English text
   - Explain context/reason for change

2. **Update Process**
   - Update English first
   - Update other languages to match
   - Maintain consistent meaning across languages

3. **Review Process**
   - Check translations make sense in context
   - Verify terminology consistency
   - Test visual layout

## 📝 Translation Guidelines

### General Rules

1. **Consistency First**
   - Use the same translation for the same concept
   - Maintain consistent tone and style
   - Follow established terminology

2. **Context Matters**
   - Consider where text appears (button, title, error message)
   - Account for space limitations
   - Think about user actions and expectations

3. **Cultural Adaptation**
   - Use appropriate formality level
   - Consider cultural preferences
   - Adapt idioms and expressions

### Language-Specific Guidelines

#### Croatian (hr)
- Use formal tone for business context
- Prefer Croatian terms over foreign words when available
- Use Croatian currency symbols and date formats

#### Bosnian (bs)  
- Similar to Croatian but with some vocabulary differences
- When in doubt, coordinate with Croatian translation
- Consider both Latin and Cyrillic contexts

#### German (de)
- Use formal "Sie" form for business applications
- German text is typically 20-30% longer than English
- Use compound words appropriately
- Follow German capitalization rules

### Common Patterns

#### Buttons and Actions
- Keep short and action-oriented
- Use verbs in imperative form
- Consider icon + text combinations

**Examples:**
```json
{
  "common": {
    "actions": {
      "save": "Save" / "Spremi" / "Spremi" / "Speichern",
      "cancel": "Cancel" / "Odustani" / "Odustani" / "Abbrechen",
      "confirm": "Confirm" / "Potvrdi" / "Potvrdi" / "Bestätigen"
    }
  }
}
```

#### Error Messages
- Be clear and helpful
- Explain what went wrong
- Provide next steps when possible

**Examples:**
```json
{
  "errors": {
    "networkError": "Connection failed. Please check your internet and try again.",
    "invalidEmail": "Please enter a valid email address.",
    "requiredField": "This field is required."
  }
}
```

#### Form Labels
- Clear and concise
- Consistent with field purpose
- Include required field indicators in key

**Examples:**
```json
{
  "forms": {
    "labels": {
      "email": "Email Address",
      "password": "Password", 
      "confirmPassword": "Confirm Password"
    }
  }
}
```

## 🧮 Special Formatting

### Variables and Placeholders
Some translations include dynamic content using curly braces:

```json
{
  "messages": {
    "welcome": "Welcome, {name}!",
    "itemCount": "You have {count} items"
  }
}
```

**Rules for variables:**
- Never translate the variable name inside `{}`
- Adapt sentence structure around variables
- Test with different variable lengths

**Examples:**
```json
// English
"welcome": "Welcome, {name}!"

// Croatian  
"welcome": "Dobrodošli, {name}!"

// German
"welcome": "Willkommen, {name}!"
```

### Pluralization
Some keys handle multiple quantities:

```json
{
  "plurals": {
    "items": {
      "zero": "no items",
      "one": "1 item",
      "other": "{count} items"
    }
  }
}
```

**Language-specific plural rules:**

#### English
- `zero`: "no items" 
- `one`: "1 item"
- `other`: "2+ items"

#### Croatian/Bosnian
- `zero`: "nema stavki"
- `one`: "1 stavka" 
- `few`: "2-4 stavke"
- `other`: "5+ stavki"

#### German
- `zero`: "keine Artikel"
- `one`: "1 Artikel"
- `other`: "2+ Artikel"

## 🛠️ Tools and Resources

### Recommended Tools

1. **JSON Editor/Validator**
   - Use any text editor with JSON support
   - VS Code with JSON extensions
   - Online JSON validators for syntax checking

2. **Translation Memory**
   - Keep a glossary of common terms
   - Maintain consistency across projects
   - Document decisions and rationale

3. **Context Resources**
   - Screenshots of UI elements
   - User journey descriptions
   - Business context documentation

### Quality Assurance Checklist

#### Before Submitting Translations
- [ ] All 4 language files updated
- [ ] JSON syntax is valid (no missing commas/brackets)
- [ ] Variable names unchanged in curly braces
- [ ] Consistent terminology used
- [ ] Text length appropriate for UI
- [ ] Formal tone maintained

#### Testing Checklist
- [ ] Text displays correctly in all languages
- [ ] No layout breaking with longer text
- [ ] Variables replaced properly
- [ ] Pluralization works correctly
- [ ] No missing translations (fallbacks working)

## 🔍 Common Issues and Solutions

### Issue: Text Too Long
**Problem**: German translation doesn't fit in button
**Solution**: 
- Use shorter synonyms
- Abbreviate appropriately  
- Coordinate with developer for UI adjustments

### Issue: Missing Context
**Problem**: Not sure how to translate technical term
**Solution**:
- Ask developer for screenshots
- Understand user workflow
- Check similar applications for reference

### Issue: Inconsistent Terminology  
**Problem**: Same concept translated differently
**Solution**:
- Create translation glossary
- Search existing translations for patterns
- Establish team guidelines

### Issue: JSON Syntax Errors
**Problem**: File won't load due to syntax errors
**Solution**:
- Check for missing commas
- Verify bracket matching
- Use online JSON validator
- Ask developer for help

## 📊 Translation Priorities

### High Priority (Must Translate)
- Navigation menus
- Form labels and validation
- Error messages
- Common actions (save, cancel, etc.)
- Authentication flows

### Medium Priority (Should Translate)
- Page titles and descriptions
- Help text and tooltips
- Empty state messages
- Success notifications

### Low Priority (Nice to Have)
- Advanced settings
- Technical error details
- Debug information
- Admin-only features

## 📞 Getting Help

### When to Ask Developers
- Need UI context or screenshots
- Technical terms requiring explanation
- JSON syntax errors
- Testing assistance

### When to Ask Content Team Lead
- Terminology decisions
- Tone and style questions  
- Priority clarification
- Process improvements

### When to Ask Native Speakers
- Cultural appropriateness
- Natural phrasing
- Regional variations
- Idiomatic expressions

## 📋 Handoff Process

### From Development to Content
1. Developer provides:
   - List of keys to translate
   - English text
   - UI context/screenshots
   - Deadline and priority

2. Content team confirms:
   - Understanding of context
   - Timeline feasibility
   - Resource availability

### From Content to Development
1. Content team provides:
   - Updated translation files
   - Notes on any challenges
   - Suggestions for UI improvements
   - Testing requests

2. Developer validates:
   - JSON syntax correctness
   - Key completeness
   - UI integration
   - Cross-language testing

## 🔄 Maintenance and Updates

### Regular Tasks
- **Weekly**: Review new translation requests
- **Monthly**: Check for orphaned or unused keys  
- **Quarterly**: Terminology consistency review
- **Annually**: Full translation quality audit

### When Product Changes
- New features → New translation keys
- UI updates → Text length adjustments
- User feedback → Translation improvements
- Market expansion → New language support

## 📚 Quick Reference

### File Locations
```
messages/en.json → English (base)
messages/hr.json → Croatian  
messages/bs.json → Bosnian
messages/de.json → German
```

### Key Structure
```
category.subcategory.keyName
```

### Common Categories
- `common.*` → Shared elements
- `forms.*` → Form content
- `pages.*` → Page-specific
- `navigation.*` → Menus
- `auth.*` → Authentication

### JSON Syntax Reminder
```json
{
  "key": "value",
  "nested": {
    "subkey": "subvalue"
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: January 26, 2025  
**Next Review**: Quarterly  
**Contact**: GS-CMS Development Team