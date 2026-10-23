FROM node:24-trixie-slim AS build

WORKDIR /app

# install dependencies first so they are cached between source changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev


FROM node:24-trixie-slim AS run

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/shared/pocketdimension.db

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/database ./database
COPY --from=build /app/server.js ./server.js
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p shared && chown node:node shared

VOLUME ["/app/shared"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/about').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Starts as root only to fix volume ownership and join the Docker socket group,
# then runs the app as the unprivileged "node" user.
ENTRYPOINT ["docker-entrypoint.sh"]
