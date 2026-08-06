/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_BUILD_MODE: string;
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_GENERATE_SOURCEMAP: string;
  readonly VITE_INLINE_VITE_ASSETS?: string;
  readonly VITE_COMPRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // Vue 官方 SFC 类型声明的标准写法，any 仅为泛型占位（运行时无实际含义），故保留
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<object, object, any>;
  export default component;
}
