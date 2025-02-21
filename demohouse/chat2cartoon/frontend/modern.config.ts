import { appTools, defineConfig } from '@modern-js/app-tools';
import * as tailwindConfig from './tailwind.config';
import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  runtime: {
    router: true,
  },
  tools: {
    tailwindcss: tailwindConfig,
    devServer: {
      proxy: {
        ['/api/v3/contents/generations/tasks']: {
          target: 'https://ark.cn-beijing.volces.com',
          changeOrigin: true,
        },
      }
    }
  },
  source: {
    globalVars: {
      'process.env.VOLC_ACCESS_KEY': process.env.VOLC_ACCESS_KEY,
      'process.env.VOLC_SECRET_KEY': process.env.VOLC_SECRET_KEY,
      'process.env.ARK_API_KEY': process.env.ARK_API_KEY,
    }
  },
  plugins: [
    appTools({
      bundler: 'rspack', // Set to 'webpack' to enable webpack
    }),
    tailwindcssPlugin(),
  ],
});
