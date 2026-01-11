FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS release
# gitをインストール
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY --from=install /usr/src/app/node_modules ./node_modules

# git設定ファイルをコピー
COPY .git ./.git
COPY .gitmodules ./.gitmodules

# サブモジュールを取得
RUN git submodule init && git submodule update

# 必要なファイルをコピー
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY public/ ./public/
COPY src/ ./src/

# .gitファイルを削除
RUN rm -rf .git

# ビルド引数 (ARG) の定義
ARG NEXT_PUBLIC_SERVER_HOST
ARG NEXT_PUBLIC_SECURE_CONNECTION
ARG NEXT_PUBLIC_SOUNDPATH
ARG NEXT_PUBLIC_IMAGE_SELF_HOSTING
ARG NEXT_PUBLIC_IMAGE_SIZE

# Next.jsビルド時に参照できるよう環境変数 (ENV) へ代入
ENV NEXT_PUBLIC_SERVER_HOST=$NEXT_PUBLIC_SERVER_HOST
ENV NEXT_PUBLIC_SECURE_CONNECTION=$NEXT_PUBLIC_SECURE_CONNECTION
ENV NEXT_PUBLIC_SOUNDPATH=$NEXT_PUBLIC_SOUNDPATH
ENV NEXT_PUBLIC_IMAGE_SELF_HOSTING=$NEXT_PUBLIC_IMAGE_SELF_HOSTING
ENV NEXT_PUBLIC_IMAGE_SIZE=$NEXT_PUBLIC_IMAGE_SIZE

# Next.js ビルド実行
RUN bun next build

# 実行設定
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "next", "start" ]
