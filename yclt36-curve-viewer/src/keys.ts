import type { InjectionKey } from 'vue';

/** 由 Home 提供给子页面的「关闭当前标签页」方法 */
export const CloseTabKey: InjectionKey<(path?: string) => void> = Symbol('closeTab');
