FROM node:20.17 AS build

WORKDIR /app

COPY . .

RUN npm install
RUN npx prisma migrate deploy && npx prisma generate
RUN npm run build


FROM node:20.17 AS run

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/db ./db
COPY --from=build /app/prisma ./prisma
RUN npm install --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

RUN ls
RUN ls db


ENV NODE_ENV=production
ENTRYPOINT ["node", "build"]