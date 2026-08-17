import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 全局错误边界：组件崩溃时展示友好提示而非白屏
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || '未知错误' };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  private reset = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center bg-gray-50 dark:bg-gray-950">
        <div className="text-6xl" aria-hidden="true">😵</div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">页面出错了</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md break-all">{this.state.message}</p>
        <button
          onClick={this.reset}
          className="px-5 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity"
        >
          刷新重试
        </button>
      </div>
    );
  }
}
