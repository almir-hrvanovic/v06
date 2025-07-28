# i18n Issues Quick Reference

## 🚨 Critical Issues After Fixes

### 1. Missing Translation Keys (148 total)

**Croatian (72 keys)**:
- All form validation messages (`forms.validation.*`)
- All form action messages (`forms.actions.*`)
- All form status messages (`forms.messages.*`)
- Customer/Inquiry stats (using wrong path `stats.*` instead of `customerStats.*`)

**Bosnian & German (38 keys each)**:
- Basic common keys (`common.name`, `common.email`, `common.status`)
- Navigation keys (`navigation.users`)
- User action keys (`users.actions.createUser`, `users.actions.editUser`)
- All customer stats keys

### 2. Test Infrastructure Broken

**Issues**:
- Tests looking in wrong directory (`__tests__/i18n/` vs `tests/unit/`)
- Package.json scripts point to wrong paths
- Missing test files in expected locations
- TSX not available in some environments

**To Fix**:
1. Move tests from `tests/unit/` to `__tests__/i18n/`
2. Update package.json test scripts
3. Or update jest/playwright configs to point to correct directories

### 3. Key Path Inconsistencies

**Croatian**: Uses different paths than reference
- `customers.stats.*` → should be `customers.customerStats.*`
- `inquiries.stats.*` → should be `inquiries.inquiryStats.*`

**All Languages**: Extra status keys in wrong location
- Have both `common.status` (string) and `common.status.*` (object)

### 4. Bundle Optimization Needed

- 229 total extra/orphaned keys across languages
- Optimized bundles exist but not properly integrated
- No lazy loading for large translation files

## ✅ What's Working

1. **Language Switching**: Component works correctly
2. **File Structure**: All locale files valid JSON
3. **Fallback Chains**: Properly configured
4. **Cookie Persistence**: Working as expected
5. **Basic Translations**: Common keys mostly complete

## 🔧 Immediate Actions Required

1. **Add Missing Keys**:
   ```bash
   # Priority: forms.validation.* keys (will break forms)
   # Add to hr.json, ensure consistency across languages
   ```

2. **Fix Test Paths**:
   ```bash
   # Either move tests or update configs
   mkdir -p __tests__/i18n
   mv tests/unit/*.test.ts __tests__/i18n/
   ```

3. **Standardize Key Paths**:
   ```bash
   # Replace customers.stats with customers.customerStats
   # Fix in hr.json to match en.json structure
   ```

## 📊 Impact Assessment

| Issue | User Impact | Developer Impact | Priority |
|-------|------------|------------------|----------|
| Missing validation keys | Forms won't show errors | Runtime errors | HIGH |
| Broken tests | No validation | Can't verify fixes | HIGH |
| Key inconsistencies | Confusing UX | Maintenance burden | MEDIUM |
| Extra keys | Larger bundle | Slower builds | LOW |

## 🎯 Success Criteria

- [ ] All 148 missing keys added
- [ ] Test suite runs successfully
- [ ] No console errors on any locale
- [ ] Bundle size under 100KB per locale
- [ ] All forms show proper validation messages

---
*Quick reference for i18n issues - Updated Jan 28, 2025*