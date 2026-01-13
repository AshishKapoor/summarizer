# Docker Deployment Guide

This guide explains how to deploy YNews using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Build and start all services:**

   ```bash
   docker-compose up -d
   ```

2. **Access the application:**

   - Frontend: http://localhost
   - Backend API: http://localhost:8000/api/

3. **View logs:**

   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

## Managing the Application

### Stop Services

```bash
docker-compose stop
```

### Start Services

```bash
docker-compose start
```

### Restart Services

```bash
docker-compose restart
```

### Stop and Remove Containers

```bash
docker-compose down
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

## Running Management Commands

### Fetch Hacker News Articles

```bash
docker-compose exec backend python manage.py fetch_hn
```

### Create Django Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

### Access Django Shell

```bash
docker-compose exec backend python manage.py shell
```

### Run Migrations

```bash
docker-compose exec backend python manage.py migrate
```

## Configuration

### Environment Variables

Create a `.env` file in the project root for custom configuration:

```env
# Django settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Port configuration
BACKEND_PORT=8000
FRONTEND_PORT=80
```

Then update docker-compose.yml to use these variables:

```yaml
services:
  backend:
    environment:
      - DEBUG=${DEBUG:-True}
      - SECRET_KEY=${SECRET_KEY:-django-insecure-default}
    ports:
      - "${BACKEND_PORT:-8000}:8000"
```

### Production Considerations

For production deployment, consider:

1. **Set DEBUG=False** in Django settings
2. **Use a proper SECRET_KEY** (generate a new one)
3. **Configure ALLOWED_HOSTS** properly
4. **Use PostgreSQL** instead of SQLite:
   ```yaml
   services:
     db:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: ynews
         POSTGRES_USER: ynews
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data

     backend:
       depends_on:
         - db
       environment:
         - DATABASE_URL=postgres://ynews:secure_password@db:5432/ynews
   ```
5. **Use a reverse proxy** like Traefik or Caddy for SSL/TLS
6. **Set up proper monitoring** and logging

## Volume Management

Data is persisted in Docker volumes:

- `db.sqlite3` - Database file (mounted from host)
- `staticfiles` - Django static files

### Backup Database

```bash
docker-compose exec backend python manage.py dumpdata > backup.json
```

### Restore Database

```bash
docker-compose exec -T backend python manage.py loaddata < backup.json
```

## Troubleshooting

### Check Service Status

```bash
docker-compose ps
```

### Inspect Container

```bash
docker-compose exec backend sh
```

### Remove Everything and Start Fresh

```bash
docker-compose down -v
rm -f db.sqlite3
docker-compose up -d --build
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py fetch_hn
```

### Port Already in Use

If port 80 or 8000 is already in use, modify the ports in docker-compose.yml:

```yaml
ports:
  - "8080:80" # Use port 8080 instead of 80
```

## Architecture

```
┌─────────────┐         ┌──────────────┐
│   Browser   │────────▶│   Nginx      │
└─────────────┘         │  (Frontend)  │
                        │   Port 80    │
                        └──────┬───────┘
                               │
                               │ /api/* requests
                               ▼
                        ┌──────────────┐
                        │    Django    │
                        │  (Backend)   │
                        │   Port 8000  │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   SQLite     │
                        │   Database   │
                        └──────────────┘
```

## Next Steps

- Set up a scheduled task to fetch articles regularly:

  ```bash
  # Add to crontab or use a scheduler container
  docker-compose exec backend python manage.py fetch_hn
  ```

- Configure monitoring and alerting
- Set up automated backups
- Implement CI/CD pipeline
