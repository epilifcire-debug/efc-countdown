# EFC Countdown — imagem única (frontend + servidor de GIF) para a Shard Cloud
FROM node:22-slim AS web
WORKDIR /app
COPY shared ./shared
COPY server/fonts ./server/fonts
COPY web/package.json web/package-lock.json ./web/
RUN cd web && npm ci
COPY web ./web
RUN cd web && npm run build

FROM node:22-slim
ENV NODE_ENV=production PORT=80
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY shared ./shared
COPY server ./server
COPY index.js package.json ./
COPY --from=web /app/web/dist ./web/dist
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--expose-gc", "index.js"]
