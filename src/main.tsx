import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

type BoundaryState = { error: Error | null };

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MAP132 render failure:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', padding: '28px', display: 'grid', placeItems: 'center', background: '#080B12', color: '#F3EEE6', fontFamily: 'Arial, sans-serif' }}>
          <section style={{ width: 'min(680px, 100%)', padding: '24px', border: '1px solid #FFB45B66', borderRadius: '14px', background: '#121824' }}>
            <p style={{ color: '#FFB45B', letterSpacing: '2px', fontSize: '11px', fontWeight: 700 }}>MAP132 DIGITALS / DIAGNOSTIC</p>
            <h1 style={{ fontSize: '24px', margin: '12px 0' }}>Page rendering error</h1>
            <p style={{ color: '#C8CED8', lineHeight: 1.6 }}>The website encountered a client-side error. The technical message below will help identify the cause. Your saved portfolio data has not been changed.</p>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: '14px', borderRadius: '8px', background: '#080B12', color: '#FFD18A', fontSize: '12px' }}>{this.state.error.name}: {this.state.error.message}</pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: '12px', padding: '11px 16px', border: 0, borderRadius: '7px', background: '#FFB45B', color: '#080B12', fontWeight: 700 }}>Reload website</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
