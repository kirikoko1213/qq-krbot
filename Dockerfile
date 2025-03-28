# Dockerfile

# Stage 1: Build the Go application
FROM golang:1.23 as go-builder
WORKDIR /app
COPY . .
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o app

# Stage 2: Build the frontend
FROM node:22 as frontend-builder
WORKDIR /app/manage-board
COPY manage-board/package.json manage-board/yarn.lock ./
RUN yarn install
COPY manage-board .
RUN yarn run build

# Stage 3: Create the final image
FROM nginx:alpine
WORKDIR /app

# Copy the Go application
COPY --from=go-builder /app/app .
RUN chmod +x /app/app

# Copy the frontend build to nginx
COPY --from=frontend-builder /app/manage-board/dist /usr/share/nginx/html

# Configure nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx' >> /start.sh && \
    echo 'exec ./app' >> /start.sh && \
    chmod +x /start.sh

# Expose the port the app runs on
EXPOSE 80

# Run both services
CMD ["/start.sh"]
