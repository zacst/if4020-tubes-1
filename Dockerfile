# 1. Build the Frontend (React)
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# This creates the /dist folder
RUN npm run build 

# 2. Build the Backend (Go)
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
# Build a single binary named 'server'
RUN CGO_ENABLED=0 GOOS=linux go build -o server cmd/main.go

# 3. Final Stage (The actual running container)
FROM alpine:latest
WORKDIR /root/

# Copy the binary from backend-builder
COPY --from=backend-builder /app/server .

# Copy the React build from frontend-builder to the folder expected by main.go
# Your main.go expects "./dist", so we place it at /root/dist
COPY --from=frontend-builder /app/dist ./dist

# Expose the port
EXPOSE 8080

# Run the server
CMD ["./server"]