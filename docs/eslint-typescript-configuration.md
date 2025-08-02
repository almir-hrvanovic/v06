# ESLint & TypeScript Configuration Guide

## Overview
This document describes the ESLint, TypeScript, and Prettier configuration for the project.

## ✅ Implemented Configurations

### 1. ESLint Configuration (.eslintrc.json)
- Extends `next/core-web-vitals` for Next.js best practices
- Extends `prettier` to avoid conflicts with Prettier
- Custom rules for code quality
- Proper ignore patterns

### 2. TypeScript Configuration (tsconfig.json)
- Strict mode enabled with additional checks
- Proper module resolution for Next.js
- Path aliases configured (`@/*`)
- Incremental compilation for better performance

### 3. Prettier Configuration (.prettierrc)
- No semicolons (team preference)
- Single quotes
- 2-space indentation
- 100-character line width
- Trailing commas in ES5

### 4. Editor Configuration (.editorconfig)
- Consistent formatting across all editors
- LF line endings
- UTF-8 encoding
- Trim trailing whitespace

### 5. Package Scripts
```json
"lint": "next lint",
"lint:fix": "next lint --fix",
"format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
"format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
"type-check": "tsc --noEmit"
```

## 📝 Key Features

### ESLint Rules
- **React**: Proper hooks usage, JSX best practices
- **Next.js**: Optimized for Next.js patterns
- **General**: No var, prefer const, no duplicate imports
- **Console**: Allows log, info, warn, error

### TypeScript Strict Checks
- `strict`: true (enables all strict checks)
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `noImplicitReturns`: true
- `noFallthroughCasesInSwitch`: true
- `noUncheckedIndexedAccess`: true

## 🔧 Usage

### Daily Development
```bash
# Check for linting issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format

# Check TypeScript types
npm run type-check
```

### Pre-commit Workflow
```bash
# Run all checks
npm run type-check && npm run lint && npm run format:check
```

### CI/CD Pipeline
```bash
# Should include
npm run type-check
npm run lint
npm run build
```

## 🚨 Common Issues and Solutions

### ESLint Errors
1. **Duplicate imports**: Combine imports from the same module
2. **Console statements**: Use console.info() instead of console.log()
3. **Unused variables**: Prefix with underscore (_) or remove

### TypeScript Errors
1. **Strict null checks**: Use optional chaining (?.) and nullish coalescing (??)
2. **Index access**: Check array/object access with guards
3. **Unused parameters**: Prefix with underscore (_)

## 📚 Resources
- [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/en/)

## 🎯 Benefits
1. **Consistent Code Style**: All team members write code the same way
2. **Catch Bugs Early**: TypeScript strict mode catches many bugs
3. **Better IDE Support**: Auto-completion and refactoring
4. **Automated Fixes**: Many issues can be auto-fixed
5. **Future-Proof**: Following Next.js best practices