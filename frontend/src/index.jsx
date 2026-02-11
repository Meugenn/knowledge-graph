import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import './globals.css';
import App from './App';
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from './config';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 12, color: '#666' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

const appContent = PRIVY_APP_ID ? (
  <PrivyProvider
    appId={PRIVY_APP_ID}
    clientId={PRIVY_CLIENT_ID || undefined}
    config={{
      loginMethods: ['email', 'google', 'github', 'wallet'],
      appearance: { theme: 'light' },
      embeddedWallets: {
        ethereum: { createOnLogin: 'users-without-wallets' },
      },
    }}
  >
    <App />
  </PrivyProvider>
) : (
  <App />
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {appContent}
    </ErrorBoundary>
  </React.StrictMode>
);
