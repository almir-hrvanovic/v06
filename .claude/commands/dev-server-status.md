# Dev Server Health Check

Perform a comprehensive dev server health check:

1. Check if dev server is running: `ps aux | grep "npm run dev"`
2. Test frontend endpoint: `curl -I http://localhost:3000`
3. Test backend API: `curl -I http://localhost:8080/api/health`
4. Check recent logs: `tail -n 20 dev-server.log`
5. Monitor memory usage: `top -pid $(pgrep -f "npm run dev")`

Provide a summary of the server status and any recommendations.