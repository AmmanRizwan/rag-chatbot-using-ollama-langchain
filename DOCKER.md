# Docker Setup for RAG Chatbot

This directory contains Docker configuration files for running the RAG Chatbot application using Docker and Docker Compose.

## Files Overview

- `docker-compose.yml` - Main orchestration file for all services
- `.dockerignore` - Root-level Docker ignore file
- `.env.example` - Environment variables template
- `backend/Dockerfile` - Backend Python/FastAPI container
- `backend/.dockerignore` - Backend-specific ignore file
- `chat/Dockerfile` - Frontend React/Vite container (multi-stage build)
- `chat/.dockerignore` - Frontend-specific ignore file
- `chat/nginx.conf` - Nginx configuration for serving the frontend

## Services

1. **Backend** - FastAPI application with LangChain and Ollama integration
2. **Frontend** - React application built with Vite and served by Nginx
3. **Ollama** - Optional Ollama service for running language models

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Modify environment variables in `.env` as needed:**
   ```env
   MODEL_NAME=llama3.2:1b
   BACKEND_PORT=8000
   FRONTEND_PORT=3000
   OLLAMA_PORT=11434
   ```

3. **Build and run all services:**
   ```bash
   docker-compose up --build
   ```

4. **Run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

## Service URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs
- Ollama (if enabled): http://localhost:11434

## Individual Service Commands

### Build specific service:
```bash
# Build backend only
docker-compose build backend

# Build frontend only
docker-compose build frontend
```

### Run specific service:
```bash
# Run backend only
docker-compose up backend

# Run frontend only  
docker-compose up frontend
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Development vs Production

### Development Mode
The docker-compose.yml is configured for development with:
- Volume mounting for hot reload
- Debug configurations
- Non-optimized builds

### Production Mode
For production, consider:
1. Remove volume mounts
2. Set proper environment variables
3. Use production-optimized images
4. Configure proper reverse proxy
5. Set up SSL/TLS certificates

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change ports in `.env` file if 3000, 8000, or 11434 are already in use

2. **Ollama model not found:**
   - Pull the model first: `docker exec -it rag-chatbot-ollama ollama pull llama3.2:1b`

3. **Backend health check failing:**
   - Ensure the backend exposes a `/health` endpoint
   - Check backend logs: `docker-compose logs backend`

4. **Frontend not connecting to backend:**
   - Verify API URLs in frontend configuration
   - Check CORS settings in backend

### Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache

# View running containers
docker-compose ps

# Execute command in running container
docker-compose exec backend bash
docker-compose exec frontend sh

# Pull Ollama model
docker-compose exec ollama ollama pull llama3.2:1b

# View container resource usage
docker stats
```

## Health Checks

All services include health checks:
- Backend: Checks `/health` endpoint
- Frontend: Checks root URL response
- Ollama: Checks `/api/tags` endpoint

## Volumes

- `backend_data`: Persistent storage for backend data
- `ollama_data`: Persistent storage for Ollama models

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with sensitive data
2. **Network**: Services communicate through an isolated Docker network
3. **User Privileges**: Backend runs as non-root user
4. **Security Headers**: Frontend includes security headers via Nginx

## Scaling

To scale services horizontally:
```bash
# Scale backend to 3 replicas
docker-compose up --scale backend=3

# Scale with load balancer (requires additional configuration)
docker-compose up --scale backend=3 --scale frontend=2
```

## Monitoring

Consider adding monitoring services:
- Prometheus for metrics
- Grafana for visualization
- ELK stack for logging

## Support

For issues related to:
- Docker configuration: Check Docker and Docker Compose documentation
- Application code: Refer to individual service documentation
- Ollama integration: Check Ollama documentation
