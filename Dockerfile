FROM node:20.17 AS build

WORKDIR /app

COPY . .


RUN npm install
RUN npm run build


FROM node:20.17 AS run

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/shared/ ./shared/
COPY --from=build /app/src/lib/server/database/migration/ ./src/lib/server/database/migration/
RUN npm install --omit=dev

ENV NODE_ENV=production
ENTRYPOINT ["node", "build"]