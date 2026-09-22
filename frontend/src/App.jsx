import React from 'react';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/ToastProvider';
import { ErrorState } from './components/ui/ErrorState';
import { useAppStore } from './store/useAppStore';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PriceMind AI Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pm-bg text-pm-text p-6 font-sans">
          <div className="max-w-lg w-full">
            <ErrorState
              title="Platform Runtime Exception"
              message="An unexpected error occurred during interface rendering."
              errorCode="ERR_REACT_COMPONENT_CRASH"
              errorDetails={this.state.error?.stack || this.state.error?.message || String(this.state.error)}
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const { isAuthenticated, authPage } = useAppStore();

  const renderContent = () => {
    if (!isAuthenticated) {
      if (authPage === 'signup') {
        return <Signup />;
      }
      return <Login />;
    }
    return <AppShell />;
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        {renderContent()}
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
