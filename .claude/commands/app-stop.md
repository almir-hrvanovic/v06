---
description: Stop the GS-CMS application and clean up resources
allowed-tools: 
  - Bash
  - Read
---

# Stop GS-CMS Application

Stop the GS-CMS application running on port 3000 and clean up all related resources.

## Instructions

1. Execute the robust stop script:
   ```bash
   ./app-stop.sh
   ```

2. Monitor the stop process and provide a summary including:
   - Which services were stopped
   - Any processes that required force termination
   - Cleanup actions performed
   - Final status of port 3000

3. The stop script will:
   - Gracefully stop the Next.js application on port 3000
   - Search for and stop related Node.js processes
   - Clean up cache files and build artifacts
   - Verify all services are properly stopped

4. If the stop process encounters issues:
   - Report specific processes that couldn't be stopped
   - Provide manual cleanup instructions
   - Show PIDs that may need manual intervention

The robust stop script provides:
- Graceful shutdown with TERM signals first
- Force kill as fallback if needed
- Comprehensive cleanup of cache and lock files
- Interactive prompts for related processes
- Detailed logging of all stop actions
- Final verification that all services are stopped

Always confirm that port 3000 is free after the stop process completes.