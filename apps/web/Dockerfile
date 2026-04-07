FROM node:22-alpine AS build
WORKDIR /app
COPY apps/web/package.json ./
RUN npm install
COPY apps/web/ ./
ENV VITE_API_URL=
RUN npm run build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
