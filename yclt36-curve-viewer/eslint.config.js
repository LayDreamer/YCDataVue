import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}']
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-*/**', '**/node_modules/**', 'src/api-generated/**']
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'app/overrides',
    rules: {
      // 存量 any 已清零（P1-2），收紧为 error 防止回潮；NSwag 生成代码已 ignore
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // 现有组件名多为单单词（Home/Login/Register 等），暂不强制多单词
      'vue/multi-word-component-names': 'off',
      // JS/TS 组件混合，不强制 script 块声明 lang
      'vue/block-lang': 'off',
      // vite-env.d.ts 的 DefineComponent<{}, {}, any> 泛型占位（ESLint 10 下该规则选项校验不兼容，直接关闭）
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },
  skipFormatting
);
