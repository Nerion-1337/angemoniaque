import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class SafeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorText: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorText: error?.message || String(error) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#fbbf24', fontSize: '20px', marginBottom: '12px' }}>
            Erreur d’affichage détectée
          </h2>
          <pre
            style={{
              backgroundColor: '#1e293b',
              padding: '12px',
              borderRadius: '8px',
              color: '#fda4af',
              maxWidth: '600px',
              overflowX: 'auto',
              marginBottom: '16px',
            }}
          >
            {this.state.errorText}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              backgroundColor: '#f59e0b',
              color: '#020617',
              fontWeight: 'bold',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Réinitialiser le cache local et recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SafeErrorBoundary>
      <App />
    </SafeErrorBoundary>
  </React.StrictMode>
);