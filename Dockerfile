FROM node:20.17 AS build

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build


FROM node:20.17 AS run

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/docker ./docker
RUN npm install --omit=dev

RUN useradd appuser && chown -R appuser docker
USER appuser

ENV NODE_ENV=production
ENTRYPOINT ["node", "build"]