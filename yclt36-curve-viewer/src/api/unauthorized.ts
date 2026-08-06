/**
 * 统一的 401 处理：同步内存登录态后跳转登录页。
 *
 * 必须使用动态 import 引入 useAuth，避免形成循环依赖：
 *   api/index -> unauthorized -> useAuth -> services/authService -> api/index
 * 动态 import 仅在 401 实际发生时加载模块，打破加载期循环。
 */
let redirecting = false;

export function handleUnauthorized() {
  if (redirecting) return;
  redirecting = true;

  import('@/composables/useAuth').then(({ useAuth }) => {
    useAuth().logout();
  });

  if (window.location.hash !== '#/login') {
    window.location.hash = '#/login';
  }

  // 短延迟后重置标志位，允许后续请求再次处理
  setTimeout(() => {
    redirecting = false;
  }, 1000);
}
