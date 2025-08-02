# Issue Investigation Template

## Issue Identification
**Issue ID**: [PHASE-###]
**Date Discovered**: YYYY-MM-DD HH:MM
**Reported By**: [Name/System]
**Severity**: [Critical/High/Medium/Low]
**Status**: [Open/Investigating/Resolved]

## Summary
**Brief Description**: [One sentence describing the issue]

## Symptoms
- [ ] Symptom 1 (be specific with error messages)
- [ ] Symptom 2 (include timestamps)
- [ ] Symptom 3 (mention affected users/systems)

## Initial Assessment
**Impact**:
- Users Affected: [Number/%]
- Systems Affected: [List systems]
- Business Impact: [Description]

**Urgency**: [Immediate/High/Normal/Low]

## Investigation Log

### Step 1: Initial Observations
**Time**: HH:MM
**Action**: [What was checked]
**Finding**: [What was discovered]

```
[Include relevant logs, error messages, or command outputs]
```

### Step 2: Reproduce Issue
**Time**: HH:MM
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Result**: [Could reproduce/Could not reproduce]

### Step 3: Root Cause Analysis
**Time**: HH:MM
**Investigation Method**: [Query logs/Code review/Load test/etc.]

**Findings**:
```
[Include specific evidence like code snippets, queries, configurations]
```

**Root Cause**: [Clear explanation of why this happened]

### Step 4: Impact Analysis
**Scope**:
- [ ] How long has this been happening?
- [ ] What data might be affected?
- [ ] Are there cascading effects?
- [ ] Security implications?

## Environment Details
**Server**: [Production/Staging/Dev]
**Version**: [App version/commit hash]
**Browser**: [If applicable]
**Database**: [Version and config]
**Load**: [Current load metrics]

## Related Issues
- Link to similar issue #1
- Link to similar issue #2

## Proposed Solution
**Approach**: [Brief description]

**Implementation**:
```
[Code/configuration changes needed]
```

**Risks**: [Any risks with the solution]

## Verification Plan
- [ ] Test in development
- [ ] Test in staging  
- [ ] Load test if performance-related
- [ ] Security review if applicable
- [ ] Rollback plan prepared

## Prevention Measures
- [ ] What monitoring would have caught this?
- [ ] What process changes are needed?
- [ ] What documentation needs updating?

## Timeline
- **Discovered**: YYYY-MM-DD HH:MM
- **Investigation Started**: YYYY-MM-DD HH:MM
- **Root Cause Found**: YYYY-MM-DD HH:MM
- **Fix Deployed**: YYYY-MM-DD HH:MM
- **Verified**: YYYY-MM-DD HH:MM
- **Total Time to Resolution**: X hours

## Lessons Learned
1. [Key learning 1]
2. [Key learning 2]
3. [Key learning 3]

## Sign-offs
- [ ] Technical Lead Review
- [ ] QA Verification
- [ ] Product Owner Informed
- [ ] Documentation Updated

---
*Template Version: 1.0*
*Last Updated: 2025-08-01*