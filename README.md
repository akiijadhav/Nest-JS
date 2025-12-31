## Deployment

### Configuration Files

#### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

Creates a lightweight container with your app, installing only production dependencies.

#### .dockerignore

```
node_modules
dist
.git
.env
```

Excludes unnecessary files from the container to keep it small and secure.

### Health Check

```
@Get('/health')
check()
{
  return true;
}
```

Endpoint that DigitalOcean uses to verify your app is running.

### Deploy to DigitalOcean App Platform

1. Log in to DigitalOcean
2. Create New App → Choose GitHub repo
3. Select "Dockerfile" as build method
4. Add environment variables:
    - Database URL (if using managed database)
    - Any other environment variables your app needs
5. Click Deploy

Your app will automatically deploy when you push to the main branch. DigitalOcean handles SSL, scaling, and container
management for you.
