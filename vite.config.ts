import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // 本番ビルドのベースパスは環境変数 BASE_PATH で指定する。
  // GitHub Actions 側でリポジトリ名から `/<repo>/` を渡す（下記 deploy.yml）。
  // 未指定のとき・dev サーバではルート('/')。
  base: command === 'build' ? process.env.BASE_PATH ?? '/' : '/',
}));
