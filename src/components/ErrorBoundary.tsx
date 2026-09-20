import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  scope?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.scope ? ' · ' + this.props.scope : ''}]`, error, info);
    // Hook futur pour Sentry / monitoring :
    // window.Sentry?.captureException(error, { extra: { scope: this.props.scope, stack: info.componentStack } });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-xl font-bold mb-2">Cette section a rencontré un souci</h2>
          <p className="text-sm text-acier mb-6">
            Pas d'inquiétude : vos données sont sauvegardées. Rechargez cette section ou revenez au tableau de bord.
          </p>
          {this.state.error && (
            <details className="text-left text-xs text-acier mb-4 bg-papier p-3 rounded border">
              <summary className="cursor-pointer hover:text-encre">Détails techniques</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={this.reset} className="px-4 py-2 bg-encre text-white rounded-lg hover:bg-encre-fonce">
              Réessayer
            </button>
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-papier text-encre rounded-lg hover:bg-filet-clair">
              Tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Boundary "global" pour catastrophes : si le tree React entier crash,
 * on affiche un écran plein page avec rechargement total.
 */
export class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-papier flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-2xl font-bold mb-2">Quelque chose a planté</h1>
          <p className="text-sm text-acier mb-6">
            L'application a rencontré une erreur inattendue. Vos données sont en sécurité côté serveur.
          </p>
          {this.state.error && (
            <details className="text-left text-xs text-acier mb-4 bg-papier p-3 rounded border">
              <summary className="cursor-pointer">Détails techniques</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-encre text-white rounded-lg hover:bg-encre-fonce">
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }
}
