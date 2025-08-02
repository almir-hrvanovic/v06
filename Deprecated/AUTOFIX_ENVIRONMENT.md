# Autofix Environment Setup Guide

## Overview

The Autofix Environment is an intelligent development tool that monitors your application for errors in real-time and automatically suggests or applies fixes using Claude Code. It integrates with MCP (Model Context Protocol) servers to provide comprehensive monitoring of both dev server logs and browser console output.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dev Server    │    │  Browser Tools  │    │  Autofix Env   │
│   (Next.js)     │◄──►│   MCP Server    │◄──►│   Monitor       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        ▼
         ▼                        ▼              ┌─────────────────┐
┌─────────────────┐    ┌─────────────────┐      │  Claude Code    │
│   Error Logs    │    │ Browser Console │      │   Processor     │
│                 │    │     Logs        │      │                 │
└─────────────────┘    └─────────────────┘      └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                        ┌─────────────────┐
                        │   Automated     │
                        │     Fixes       │
                        └─────────────────┘
```

## 🚀 Quick Start

### 1. Start the Complete Environment
```bash
npm run autofix:start
```

This single command starts:
- Next.js development server
- Browser Tools MCP server
- Error monitoring system
- Claude Code integration
- Web dashboard

### 2. Access the Dashboard
Open http://localhost:3001/autofix-dashboard to monitor:
- Real-time error logs
- Fix attempt history
- Error pattern analysis
- System status

## 🔧 Configuration

### Main Configuration (`.claude/autofix-config.json`)
```json
{
  "enabled": true,
  "devServerPort": 3000,
  "browserPort": 3001,
  "fixThreshold": 3,        // Errors before autofix attempt
  "fixCooldown": 10,        // Minutes between fix attempts
  "mcpIntegration": {
    "browserTools": {
      "enabled": true,
      "captureConsole": true,
      "captureNetwork": true,
      "screenshotOnError": true
    }
  }
}
```

### MCP Server Configuration (`.claude/mcp_settings.json`)
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "browser-tools-mcp",
      "args": [],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 📊 Features

### Real-Time Monitoring
- **Dev Server Logs**: Captures Next.js build errors, runtime errors, warnings
- **Browser Console**: Monitors JavaScript errors, network failures, React warnings
- **Network Requests**: Tracks failed API calls and 404 errors

### Intelligent Error Detection
- **Pattern Recognition**: Identifies recurring error types
- **Frequency Tracking**: Counts error occurrences before triggering fixes
- **Context Gathering**: Collects surrounding code and logs for better fix suggestions

### Automated Fix Application
- **Safe Fixes**: Only applies low-risk fixes automatically
- **Test Verification**: Runs tests after each fix to ensure stability  
- **Rollback Capability**: Can revert changes if tests fail
- **Fix History**: Tracks all attempted fixes for analysis

### Claude Code Integration
- **Context-Aware Prompts**: Generates detailed fix requests with full context
- **Error Analysis**: Analyzes error patterns and suggests optimal solutions
- **Code Understanding**: Leverages project structure knowledge for better fixes

## 🛠️ Individual Components

### Start Error Monitoring Only
```bash
npm run autofix:environment
```

### Start Claude Processor Only  
```bash
npm run autofix:processor
```

### Test the Setup
```bash
npx tsx scripts/test-autofix.ts
```

## 📝 Error Types Supported

### TypeScript Errors
- Missing imports
- Type mismatches
- Undefined properties
- Optional chaining opportunities

### React Errors
- Hydration mismatches
- Hook dependency warnings
- Component lifecycle issues
- State management problems

### API Errors
- 404 endpoint errors
- Network request failures
- CORS issues
- Authentication problems

### Build Errors
- Module resolution failures
- Syntax errors
- ESLint violations
- Missing dependencies

## 🔍 Monitoring & Debugging

### Log Files Location
- `logs/autofix.log` - Main error log
- `logs/autofix-session-YYYYMMDD_HHMMSS.log` - Session logs
- `logs/fix-history.json` - Applied fixes history
- `logs/autofix-report-*.json` - Individual error reports

### Dashboard Metrics
- **Total Logs**: All captured log entries
- **Error Types**: Unique error patterns detected
- **Fix Attempts**: Number of automated fix attempts
- **Success Rate**: Percentage of successful fixes

### Real-Time Updates
The dashboard refreshes every 5 seconds showing:
- Latest error entries
- Recent fix attempts
- System status
- Error frequency charts

## ⚙️ Advanced Usage

### Custom Error Patterns
Add to `.claude/autofix-config.json`:
```json
{
  "errorPatterns": {
    "ignorePatterns": [
      "Warning: ReactDOM.render is deprecated"
    ],
    "criticalPatterns": [
      "TypeError:",
      "Cannot read property"
    ]
  }
}
```

### Fix Thresholds
Configure when to attempt fixes:
```json
{
  "fixThreshold": 5,     // Wait for 5 occurrences
  "fixCooldown": 15,     // Wait 15 minutes between attempts
  "maxFixAttempts": 2    // Maximum fix attempts per error
}
```

### Notification Settings
```json
{
  "notifications": {
    "onFixAttempt": true,
    "onFixSuccess": true,
    "onFixFailure": true,
    "showInDashboard": true
  }
}
```

## 🧪 Testing Integration

### Running Tests After Fixes
The system automatically runs:
```bash
npm run build  # Verify code compiles
npm run lint   # Check code quality
npm run test   # Run test suite
```

### Custom Test Commands
Override in configuration:
```json
{
  "claudeCode": {
    "testCommands": [
      "npm run type-check",
      "npm run test:unit",
      "npm run test:integration"
    ]
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### MCP Server Not Starting
```bash
# Reinstall MCP server
npm install -g @agentdeskai/browser-tools-mcp

# Check installation
browser-tools-mcp --version
```

#### Port Conflicts
Change ports in `.claude/autofix-config.json`:
```json
{
  "devServerPort": 3002,
  "browserPort": 3003
}
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x scripts/start-autofix.sh
```

### Debug Mode
Enable verbose logging:
```json
{
  "debug": true,
  "logLevel": "verbose"
}
```

## 🚦 Best Practices

### Development Workflow
1. Start autofix environment at beginning of session
2. Develop normally - errors are captured automatically
3. Check dashboard periodically for fix suggestions
4. Review applied fixes before committing
5. Monitor fix success rate and adjust thresholds

### Code Quality
- Keep fix threshold low (3-5) for quick feedback
- Review automated fixes before production
- Use longer cooldown periods (10-15 minutes) to avoid spam
- Enable test verification for all fixes

### Team Usage
- Share configuration files in version control
- Document custom error patterns
- Review fix history during code reviews
- Set up notifications for critical errors

## 📈 Performance Impact

### Resource Usage
- **CPU**: Minimal impact during normal operation
- **Memory**: ~50-100MB additional usage
- **Network**: Local connections only
- **Storage**: Log files rotate automatically

### Optimization Tips
- Adjust monitoring frequency for better performance
- Use error pattern filtering to reduce noise
- Enable screenshot capture only for critical errors
- Archive old log files regularly

## 🔗 Integration with Existing Tools

### CI/CD Integration
Add to GitHub Actions:
```yaml
- name: Run Autofix Environment Tests
  run: npm run autofix:start &
  
- name: Verify Fixes Applied
  run: npx tsx scripts/test-autofix.ts
```

### IDE Integration
The autofix environment works alongside:
- VS Code Claude Code extension
- Cursor IDE
- Any MCP-compatible editor

### Monitoring Tools
Integrates with:
- Error tracking services (DataDog, Sentry)
- Log aggregation tools (ELK Stack)
- Performance monitoring (New Relic)

## 📚 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Browser Tools MCP Server](https://github.com/AgentDeskAI/browser-tools-mcp)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Next.js Error Handling](https://nextjs.org/docs/advanced-features/error-handling)

## 🤝 Contributing

To extend the autofix environment:

1. **Add Error Patterns**: Update error detection in `autofix-environment.ts`
2. **Custom Fixes**: Add fix logic to `claude-autofix-processor.ts`
3. **New MCP Servers**: Configure additional servers in `mcp_settings.json`
4. **Dashboard Features**: Extend the web dashboard HTML/JavaScript

## 📄 License & Support

This autofix environment is part of the GS-CMS project. For support:
- Check the troubleshooting section
- Review log files for errors
- Test with `npm run test-autofix`
- Contact the development team for advanced issues