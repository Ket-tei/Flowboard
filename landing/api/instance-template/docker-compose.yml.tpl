services:
  db:
    image: mariadb:11
    command:
      - "--performance-schema=OFF"
      - "--innodb-buffer-pool-size=64M"
      - "--innodb-log-buffer-size=8M"
      - "--max-connections=40"
      - "--skip-name-resolve"
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
    mem_limit: 256m
    cpus: 0.75
    networks:
      - internal

  api:
    image: flowboard-api:latest
    environment:
      DATABASE_URL: "mysql://{{MYSQL_USER}}:{{MYSQL_PASSWORD}}@db:3306/{{MYSQL_DATABASE}}"
      JWT_SECRET: "{{JWT_SECRET}}"
      ADMIN_BOOTSTRAP_USERNAME: "{{ADMIN_EMAIL}}"
      ADMIN_BOOTSTRAP_PASSWORD: "{{ADMIN_PASSWORD}}"
      UPLOAD_DIR: /data/uploads
      CORS_ORIGIN: "{{CORS_ORIGIN}}"
      PORT: "3001"
      NODE_ENV: production
      NODE_OPTIONS: "--max-old-space-size=192"
      INSTANCE_SLUG: "{{INSTANCE_SLUG}}"
      INSTANCE_DELETE_TOKEN: "{{INSTANCE_DELETE_TOKEN}}"
      LANDING_API_URL: "{{LANDING_API_URL}}"
      PLAN_ID: "{{PLAN_ID}}"
    volumes:
      - uploads_data:/data/uploads
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      db:
        condition: service_healthy
    mem_limit: 256m
    cpus: 0.75
    networks:
      - internal

  web:
    image: flowboard-web:latest
    depends_on:
      - api
    mem_limit: 32m
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
