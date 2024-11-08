FROM node:20.17 AS build

WORKDIR /app

# copy everything to the container
COPY . .

# clean install all dependencies
RUN npm ci

# build SvelteKit app
RUN npm run build

FROM node:20.17 AS run

WORKDIR /app

# copy dependency list
COPY --from=build /app/package*.json ./

# clean install dependencies, no devDependencies, no prepare script
RUN npm install --omit dev

# copy built SvelteKit app to /app
COPY --from=build /app/build ./build

# copy database files
COPY --from=build /app/database ./database

# create locale db folder
RUN mkdir -p shared


ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["node", "build"]