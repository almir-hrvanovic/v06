# 🚨 CRITICAL: Issue Resolution Protocol

## Core Principle
**"Don't Assume - Consult Documentation! Think HARD, analyse issue, use detailed loggings, find solution that is in sync with project logic and planned activities, Update documentation with issues and solutions. Repeat if needed until all fixed."**

## The 6-Step Resolution Process

### 1. 📚 DON'T ASSUME - CONSULT DOCUMENTATION
Before any action:
- [ ] Check existing project documentation (CLAUDE.md, README.md)
- [ ] Review relevant optimization phase documentation
- [ ] Search MASTER-ISSUE-LOG.md for similar issues
- [ ] Verify current project state and configuration

**CRITICAL**: Never proceed based on assumptions about how something "should" work.

### 2. 🧠 THINK HARD - ANALYZE THE ISSUE
Document your analysis:
```markdown
## Issue Analysis Template
**Issue ID**: [YYYY-MM-DD-XXX]
**Phase**: [Current optimization phase]
**Component**: [Affected component/system]

### Symptoms
- What is happening?
- What should be happening?
- When did it start?

### Initial Hypothesis
- Theory 1: [Description]
- Theory 2: [Description]

### Documentation Consulted
- [ ] File 1: [Path] - [Relevant section]
- [ ] File 2: [Path] - [Relevant section]
```

### 3. 📊 USE DETAILED LOGGING
Implement comprehensive logging using our OptimizationLogger utility:
```typescript
import { OptimizationLogger } from '../Templates/logging-utility';

const logger = new OptimizationLogger('issue-001', 'database');
logger.startOperation('query-optimization');

// Log every step
logger.log('DEBUG', 'Analyzing query performance', { query: sqlQuery });
logger.log('INFO', 'Found slow query', { executionTime: 5000 });
logger.log('ERROR', 'Optimization failed', { error: errorDetails });

logger.endOperation('query-optimization', false, { reason: 'timeout' });
```

### 4. 🎯 FIND SOLUTION IN SYNC WITH PROJECT LOGIC
Solution criteria checklist:
- [ ] Aligns with current optimization phase goals
- [ ] Compatible with existing project architecture
- [ ] Doesn't break other optimizations
- [ ] Follows project coding standards
- [ ] Performance impact assessed
- [ ] Rollback plan defined

### 5. 📝 UPDATE DOCUMENTATION
Required documentation updates:
- [ ] Phase-specific issues-and-solutions.md
- [ ] MASTER-ISSUE-LOG.md
- [ ] Relevant implementation guides
- [ ] Solutions database for future reference

### 6. 🔄 REPEAT IF NEEDED
If issue persists:
- [ ] Re-read all relevant documentation
- [ ] Add more detailed logging
- [ ] Consult different documentation sources
- [ ] Document new findings
- [ ] Try alternative solution approach

## Critical Success Patterns

### Pattern 1: Documentation-First Debugging
```
1. Read relevant docs → 2. Form hypothesis → 3. Test with logging → 4. Document results
```

### Pattern 2: Incremental Resolution
```
1. Fix smallest part → 2. Test → 3. Document → 4. Move to next part
```

### Pattern 3: Collaborative Problem Solving
```
1. Document issue clearly → 2. Share findings → 3. Get input → 4. Implement consensus solution
```

## Anti-Patterns to Avoid

### ❌ Assumption-Based Fixing
"I think this should work..." → STOP! Consult documentation first.

### ❌ Undocumented Changes
"Quick fix, no need to document" → WRONG! Every change must be documented.

### ❌ Incomplete Logging
"Basic console.log is enough" → NO! Use OptimizationLogger for comprehensive tracking.

### ❌ Isolated Problem Solving
"I'll figure it out myself" → INCORRECT! Check existing solutions first.

## Emergency Escalation

If you encounter:
- Data loss risk
- Security vulnerability
- Complete system failure
- Cannot find documentation

**IMMEDIATELY**:
1. Stop all work
2. Document current state
3. Enable maximum logging
4. Alert team lead
5. Implement emergency rollback

## Documentation Quick Links

- [Project Configuration](../CLAUDE.md)
- [Master Issue Log](./Issues/MASTER-ISSUE-LOG.md)
- [Solutions Database](./Issues/solutions-database.md)
- [Logging Standards](./Templates/logging-standards.md)
- [Rollback Procedures](./00-Foundation/rollback-procedures.md)

---
*Remember: "Don't Assume - Consult Documentation!" is not just a guideline, it's THE WAY.*