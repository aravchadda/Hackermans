# How IIS Setup Works

This document explains the architecture and request flow of the IIS deployment.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
│              http://localhost (Port 80)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              IIS Frontend Website (Port 80)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  URL Rewrite Module (Reverse Proxy)                  │   │
│  │                                                       │   │
│  │  Rules:                                              │   │
│  │  1. /api/* → http://localhost:4000/api/*            │   │
│  │  2. /flask-api/* → http://localhost:5001/*          │   │
│  │  3. /* → /index.html (React SPA)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Physical Path: frontend/terminal/build/                    │
│  (Static React files: HTML, CSS, JS, images)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│ IIS Backend Site │        │  IIS Flask Site  │
│   (Port 8080)    │        │   (Port 8081)    │
│                  │        │                  │
│ Reverse Proxy    │        │ Reverse Proxy    │
│ All requests →   │        │ All requests →   │
│ localhost:4000   │        │ localhost:5001   │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│ Node.js Backend  │        │ Flask AI Service │
│  (Port 4000)     │        │   (Port 5001)    │
│                  │        │                  │
│ Express Server   │        │ Flask Server     │
│ DuckDB Database  │        │ Ollama Client    │
└──────────────────┘        └──────────────────┘
```

## Request Flow Examples

### Example 1: Loading the Frontend

```
1. Browser → http://localhost/
2. IIS Frontend (Port 80) receives request
3. URL Rewrite checks: Does URL match /api/*? No
4. URL Rewrite checks: Does URL match /flask-api/*? No
5. URL Rewrite: Serve static file or /index.html (React SPA routing)
6. IIS serves index.html from frontend/terminal/build/
7. Browser receives HTML, loads React app
8. React app makes API calls to /api/...
```

### Example 2: API Request from Frontend

```
1. React App → http://localhost/api/schema
2. IIS Frontend (Port 80) receives /api/schema
3. URL Rewrite matches rule: /api/* → http://localhost:4000/api/*
4. IIS forwards request to Node.js backend on port 4000
5. Node.js processes request, queries DuckDB
6. Response sent back through IIS to browser
7. React app receives JSON data
```

### Example 3: Flask AI Service Request

```
1. React App → http://localhost/flask-api/generate-graph-json
2. IIS Frontend (Port 80) receives /flask-api/generate-graph-json
3. URL Rewrite matches rule: /flask-api/* → http://localhost:5001/*
4. IIS forwards request to Flask service on port 5001
5. Flask processes request, calls Ollama
6. Response sent back through IIS to browser
7. React app receives chart JSON
```

## Key Components Explained

### 1. IIS URL Rewrite Module

The **URL Rewrite Module** is an IIS extension that allows you to:
- Rewrite URLs (change what the user sees)
- Redirect requests
- **Reverse proxy** (forward requests to other servers)

In our setup, we use it for **reverse proxying** - IIS acts as a middleman, forwarding requests to the actual backend services.

### 2. Reverse Proxy Pattern

Instead of running Node.js and Flask directly in IIS (which would require special modules), we:
- Keep services running as standalone processes (Node.js, Python)
- Use IIS as a reverse proxy to forward requests
- Benefits:
  - No need for iisnode or HttpPlatformHandler
  - Services can run independently
  - Easier debugging and maintenance
  - Standard deployment pattern

### 3. Frontend Website (Port 80)

**Purpose**: Serve React static files and route API requests

**Configuration** (`iis/frontend/web.config`):

```xml
<!-- Rule 1: Proxy /api/* to Node.js backend -->
<rule name="Proxy API Requests">
  <match url="^api/(.*)" />
  <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
</rule>

<!-- Rule 2: Proxy /flask-api/* to Flask service -->
<rule name="Proxy Flask AI Service">
  <match url="^flask-api/(.*)" />
  <action type="Rewrite" url="http://localhost:5001/{R:1}" />
</rule>

<!-- Rule 3: Serve React app (SPA routing) -->
<rule name="React App">
  <match url=".*" />
  <action type="Rewrite" url="/index.html" />
</rule>
```

**How it works**:
- Static files (JS, CSS, images) are served directly from `build/` folder
- API requests (`/api/*`) are forwarded to Node.js backend
- Flask requests (`/flask-api/*`) are forwarded to Flask service
- All other requests serve `index.html` (for React Router)

### 4. Backend Website (Port 8080)

**Purpose**: Direct access to Node.js backend API (optional, for direct API calls)

**Configuration** (`iis/backend/web.config`):

```xml
<!-- Forward all requests to Node.js -->
<rule name="Node.js Backend">
  <match url="(.*)" />
  <action type="Rewrite" url="http://localhost:4000/{R:1}" />
</rule>
```

**How it works**:
- All requests to port 8080 are forwarded to Node.js on port 4000
- Useful for direct API testing or external integrations
- Not required for frontend (frontend uses port 80 with `/api/*` routing)

### 5. Flask Website (Port 8081)

**Purpose**: Direct access to Flask AI service (optional)

**Configuration** (`iis/flask/web.config`):

```xml
<!-- Forward all requests to Flask -->
<rule name="Flask AI Service">
  <match url="(.*)" />
  <action type="Rewrite" url="http://localhost:5001/{R:1}" />
</rule>
```

**How it works**:
- All requests to port 8081 are forwarded to Flask on port 5001
- Useful for direct API testing
- Frontend uses port 80 with `/flask-api/*` routing instead

## Why This Architecture?

### Advantages

1. **Separation of Concerns**
   - Frontend (static files) separate from backend (dynamic)
   - Each service runs independently
   - Easy to scale individual components

2. **No Special IIS Modules Required**
   - Don't need iisnode (Node.js in IIS)
   - Don't need HttpPlatformHandler (Python in IIS)
   - Just URL Rewrite module (standard IIS extension)

3. **Development Parity**
   - Same services run in development and production
   - No special IIS-specific code needed
   - Easy to debug (services run in separate processes)

4. **Flexibility**
   - Can run services on different machines
   - Can add load balancing later
   - Can use different ports/protocols

5. **Standard Pattern**
   - Reverse proxy is industry standard
   - Works with any web server (IIS, Nginx, Apache)
   - Easy to understand and maintain

### How It Differs from Other Approaches

#### Alternative 1: iisnode (Node.js in IIS)
```
❌ Requires special module
❌ Tied to IIS
❌ Harder to debug
❌ Less flexible
```

#### Alternative 2: HttpPlatformHandler (Python in IIS)
```
❌ Requires special handler
❌ Tied to IIS
❌ Less control over process
```

#### Our Approach: Reverse Proxy
```
✅ Standard IIS feature (URL Rewrite)
✅ Services run independently
✅ Easy to debug
✅ Portable to other servers
✅ Industry standard pattern
```

## Request Matching Logic

When a request comes to IIS Frontend (Port 80):

```
Request: http://localhost/api/schema

1. Check Rule 1: Does URL match "^api/(.*)"?
   ✅ YES → Forward to http://localhost:4000/api/schema
   → STOP (stopProcessing="true")

Request: http://localhost/flask-api/health

1. Check Rule 1: Does URL match "^api/(.*)"?
   ❌ NO → Continue

2. Check Rule 2: Does URL match "^flask-api/(.*)"?
   ✅ YES → Forward to http://localhost:5001/health
   → STOP

Request: http://localhost/dashboard

1. Check Rule 1: Does URL match "^api/(.*)"?
   ❌ NO → Continue

2. Check Rule 2: Does URL match "^flask-api/(.*)"?
   ❌ NO → Continue

3. Check Rule 3: Is it a file or directory?
   ❌ NO → Serve /index.html (React handles routing)
   → STOP
```

## Configuration Details

### Server Variables

```xml
<serverVariables>
  <set name="HTTP_ACCEPT_ENCODING" value="" />
</serverVariables>
```

**Why?** Disables compression for proxied requests to avoid double compression issues.

### Outbound Rules

```xml
<outboundRules>
  <rule name="Preserve Host Header">
    <match serverVariable="HTTP_X_ORIGINAL_HOST" pattern=".*" />
    <action type="Rewrite" value="{HTTP_HOST}" />
  </rule>
</outboundRules>
```

**Why?** Preserves the original host header so backend services know the original request domain.

### SPA Routing

```xml
<rule name="React App">
  <match url=".*" />
  <conditions>
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
  </conditions>
  <action type="Rewrite" url="/index.html" />
</rule>
```

**Why?** React Router uses client-side routing. When user navigates to `/dashboard`, the server needs to serve `index.html` (not look for a `/dashboard` file), then React Router handles the routing.

## Port Summary

| Service | Internal Port | IIS Port | Purpose |
|---------|--------------|----------|---------|
| Frontend | N/A (static) | 80 | Main website |
| Node.js Backend | 4000 | 8080 | API server |
| Flask AI Service | 5001 | 8081 | AI/ML endpoints |
| Ollama | 11434 | N/A | LLM service |

## Security Considerations

1. **CORS Configuration**: Backend allows requests from `http://localhost`
2. **Security Headers**: Added in web.config (X-Frame-Options, etc.)
3. **Internal Services**: Backend services (4000, 5001) only accessible via localhost
4. **Firewall**: Can restrict external access to port 80 only

## Troubleshooting Flow

If a request fails:

1. **Check IIS is receiving request**: Check IIS logs
2. **Check URL Rewrite rules**: Verify rule matches
3. **Check backend service**: Is Node.js/Flask running?
4. **Check port**: Is service listening on correct port?
5. **Check firewall**: Is port accessible?
6. **Check CORS**: Are origins allowed?

## Summary

The IIS setup uses **reverse proxy** pattern:
- IIS serves static frontend files
- IIS forwards API requests to backend services
- Backend services run as independent processes
- No special IIS modules required (just URL Rewrite)
- Standard, maintainable, and flexible architecture

This is the same pattern used by Nginx, Apache, and other web servers - just configured for IIS!



