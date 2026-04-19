FROM oven/bun:1 AS build
WORKDIR /app

# Install server deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Install client deps and build
COPY client/package.json client/bun.lock ./client/
RUN cd client && bun install --frozen-lockfile
COPY client ./client
RUN cd client && bun run build

# Copy server source
COPY src ./src
COPY tsconfig.json ./

FROM oven/bun:1
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/bun.lockb* ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/src ./src
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
