# ---------- GIAI ĐOẠN 1: dựng bản sản xuất bằng Vite ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Địa chỉ API được "đóng" vào bản dựng lúc build (biến VITE_* chỉ có tác dụng lúc build)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------- GIAI ĐOẠN 2: nginx phục vụ tệp tĩnh ----------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=6 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
