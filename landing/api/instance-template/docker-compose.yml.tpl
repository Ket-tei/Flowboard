services:
  db:
    image: mariadb:11
    environment:
      MYSQL_ROOT_PASSWORD: "{{MYSQL_ROOT_PASSWORD}}"
      MYSQL_DATABASE: "{{MYSQL_DATABASE}}"
      MYSQL_USER: "{{MYSQL_USER}}"
      MYSQL_PASSWORD: "{{MYSQL_PASSWORD}}"
    volumes:
      - mariadb_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 15
      start_period: 30s
    networks:
      - internal

  api:
    build:
      context: "{{APP_ROOT}}"
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: "mysql://{{MYSQL_USER}}:{{MYSQL_PASSWORD}}@db:3306/{{MYSQL_DATABASE}}"
      JWT_SECRET: "{{JWT_SECRET}}"
      ADMIN_BOOTSTRAP_USERNAME: "{{ADMIN_EMAIL}}"
      ADMIN_BOOTSTRAP_PASSWORD: "{{ADMIN_PASSWORD}}"
      UPLOAD_DIR: /data/uploads
      CORS_ORIGIN: "{{CORS_ORIGIN}}"
      PORT: "3001"
      NODE_ENV: production
      INSTANCE_SLUG: "{{INSTANCE_SLUG}}"
      INSTANCE_DELETE_TOKEN: "{{INSTANCE_DELETE_TOKEN}}"
      LANDING_API_URL: "{{LANDING_API_URL}}"
    volumes:
      - uploads_data:/data/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - internal

  web:
    build:
      context: "{{APP_ROOT}}"
      dockerfile: apps/web/Dockerfile
    depends_on:
      - api
    networks:
      - internal
      - gateway

volumes:
  mariadb_data:
  uploads_data:

networks:
  internal:
  gateway:
    external: true
    name: flowboard_gateway
