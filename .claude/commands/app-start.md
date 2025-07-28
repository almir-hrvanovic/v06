---
description: Start the GS-CMS application with robust error monitoring
allowed-tools: 
  - Bash
  - Read
---

# Start GS-CMS Application

Start the GS-CMS application using the robust startup script with comprehensive error monitoring and logging.

## Instructions

1. Execute the robust startup script:
   ```bash
   ./start-robust.sh
   ```

2. Monitor the startup process and provide a summary including:
   - Success/failure status
   - Application URL (typically http://localhost:3000 or 3001)
   - Health check results for all services
   - Any errors or warnings encountered

3. If startup fails:
   - Check the error logs in `./logs/` directory
   - Read and report the specific error details
   - Provide troubleshooting recommendations

4. If startup succeeds:
   - Verify application is accessible
   - Test the health endpoint: `curl http://localhost:3000/api/health`
   - Report status of all services (database, Redis, API endpoints)

The robust startup script provides:
- Error-driven development with comprehensive logging
- 6-phase startup process with health verification
- Automatic recovery from common issues
- Detailed error reporting for troubleshooting
- Real-time service health monitoring

Always summarize the final application status and provide the access URL.