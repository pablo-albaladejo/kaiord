# Container image for the Kaiord MCP server (`@kaiord/mcp`).
#
# It is the only container this monorepo produces: the CLI ships on npm, the
# SPA and docs site ship as static builds. The image is built from the tree at
# this commit rather than from the published npm package, so the tools it
# exposes are the ones in the commit being built.
#
# The server speaks MCP over stdio, so run it attached, never detached:
#
#     docker run --rm -i kaiord-mcp
#
# It reads JSON-RPC on stdin and answers on stdout; diagnostics go to stderr.
# Tools such as kaiord_convert accept an `input_file` path, which resolves
# inside the container — mount a directory to give them real files to read:
#
#     docker run --rm -i -v "$PWD:/data" -w /data kaiord-mcp
#
# The server runs as the unprivileged `node` user (uid 1000), so a mount it is
# asked to write to (`output_file`) has to be writable by that uid.

FROM node:22-alpine AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# @kaiord/zwo validates Zwift files against the XSD through
# xsd-schema-validator, which shells out to a JVM. Its postinstall compiles a
# Java helper, so the build stage needs a JDK (javac), while the runtime stage
# only needs a JRE to execute the compiled helper. Neither is optional: with no
# JVM, XSD validation reports every .zwo file as invalid rather than failing
# loudly.
RUN apk add --no-cache openjdk21-jdk

WORKDIR /repo
COPY . .

# `@kaiord/mcp...` selects the server plus the workspace packages it depends
# on, so the SPA, docs and browser-extension toolchains are never installed.
# --ignore-scripts skips husky's `prepare`, which has no meaning outside a git
# checkout; the one dependency script that matters — xsd-schema-validator
# compiling its Java helper — runs below, against the tree that actually ships.
RUN pnpm install --frozen-lockfile --ignore-scripts --filter "@kaiord/mcp..."
RUN pnpm --filter "@kaiord/mcp..." build

# `pnpm deploy` rewrites the `workspace:^` links into a self-contained
# node_modules tree, so the runtime stage needs nothing from the monorepo. It
# runs install scripts, which is where the Java helper gets compiled.
RUN pnpm deploy --filter=@kaiord/mcp --prod /app

FROM node:22-alpine AS runtime

RUN apk add --no-cache openjdk21-jre-headless

ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./

USER node

ENTRYPOINT ["node", "dist/bin/kaiord-mcp.js"]
