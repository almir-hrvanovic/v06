# Docker Setup Guide for GS-CMS

## Quick Start

### 1. Development Environment (Local Development)
Use this for local development with hot-reload:

```bash
# Start PostgreSQL and Redis only
docker-compose -f docker-compose.dev.yml up -d

# Create .env.local with:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Run the app locally
npm install
npm run dev
```

### 2. Production Environment (Full Stack)
Use this to run the entire application in Docker:

```bash
# Create .env file for Docker
cp .env.example .env

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# First time setup - seed the database
docker-compose exec app npx prisma db seed
```

## Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (careful - deletes data!)
docker-compose down -v

# Rebuild after code changes
docker-compose build app
docker-compose up -d
```

### Database Management
```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate

# Seed database
docker-compose exec app npx prisma db seed

# Open Prisma Studio
docker-compose exec app npx prisma studio
```

### Debugging
```bash
# View logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# Access app container
docker-compose exec app sh

# Check database connection
docker-compose exec postgres psql -U postgres -d gs_cms_v05
```

## Environment Variables

### Required for Docker
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/gs_cms_v05

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Redis
REDIS_URL=redis://redis:6379

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - Seed database on first run
SEED_DATABASE=true
```

## Docker Architecture

### Services
1. **app**: Next.js application (port 3000)
2. **postgres**: PostgreSQL database (port 5432)
3. **redis**: Redis cache (port 6379)
4. **adminer**: Database GUI (port 8080)

### Volumes
- `postgres-data`: Database persistence
- `redis-data`: Cache persistence
- `uploaded-files`: File uploads

### Networks
- `gs-cms-network`: Internal network for service communication

## Production Deployment with Docker

### 1. Using Docker Compose on VPS
```bash
# Clone repository
git clone <repo-url>
cd gs-cms-v05

# Create production .env
nano .env

# Start services
docker-compose -f docker-compose.yml up -d
```

### 2. Using Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml gs-cms
```

### 3. Using Kubernetes
See `kubernetes/` directory for K8s manifests (future implementation).

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Common issues:
# - Database not ready: Wait 30 seconds and try again
# - Port already in use: Change ports in docker-compose.yml
# - Permission issues: Check file ownership
```

### Database Connection Failed
```bash
# Test connection
docker-compose exec app nc -zv postgres 5432

# Check PostgreSQL logs
docker-compose logs postgres
```

### Build Failures
```bash
# Clean build
docker-compose build --no-cache app

# Remove all containers and volumes
docker-compose down -v
docker system prune -a
```

## Performance Optimization

### 1. Multi-stage Build
The Dockerfile uses multi-stage builds to minimize image size:
- `deps`: Install dependencies
- `builder`: Build application
- `runner`: Production runtime

### 2. Layer Caching
Order Dockerfile commands to maximize cache hits:
- Copy package files first
- Install dependencies
- Copy source code
- Build application

### 3. Resource Limits
Add to docker-compose.yml:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Security Best Practices

1. **Don't use default passwords in production**
2. **Use secrets management for sensitive data**
3. **Keep images updated regularly**
4. **Use non-root user (already implemented)**
5. **Scan images for vulnerabilities**:
   ```bash
   docker scan gs-cms-v05_app
   ```

## Backup and Restore

### Backup Database
```bash
# Backup
docker-compose exec postgres pg_dump -U postgres gs_cms_v05 > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres gs_cms_v05 < backup.sql
```

### Backup Volumes
```bash
# Backup all volumes
docker run --rm -v gs-cms-v05_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## Monitoring

### Health Checks
Health checks are configured for:
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`

### Logs
Configure log rotation in docker-compose.yml:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```