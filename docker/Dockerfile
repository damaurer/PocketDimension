FROM node:20.17 AS build

WORKDIR /app


COPY package.json .

COPY . .

#bcrypt_lib.node: invalid ELF header fix
# install new dependencies if any
RUN npm install

# uninstall the current Windows modules
RUN npm uninstall bcrypt @prisma/client

# install the Linux modules for the machine
RUN npm install bcrypt @prisma/client


RUN npx prisma db pull
RUN npm run build
RUN npm prune --production

FROM node:20.17 AS run

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/db ./db
RUN ulimit -c unlimited
ENTRYPOINT ["node", "build"]