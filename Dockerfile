# ---------- GIAI ĐOẠN 1: cài phụ thuộc theo đúng package-lock.json ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Chép RIÊNG tệp khoá trước để Docker dùng lại lớp cache khi chỉ sửa mã
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- GIAI ĐOẠN 2: ảnh chạy ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/backend ./src/backend

# Ảnh node có sẵn người dùng không đặc quyền tên "node"
USER node
EXPOSE 3000

# Healthcheck để docker compose biết API đã SẴN SÀNG (không chỉ "đã khởi động")
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
  CMD ["node","-e","fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "src/backend/server.js"]
