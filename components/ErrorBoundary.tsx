import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * AppErrorBoundary captures rendering errors in its child component tree.
 */
export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly defining the constructor to help TypeScript recognize inherited properties like 'this.props'
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log node failure for telemetry purposes
    console.error('PureAir Node Exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for catastrophic node failure
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8">
            <AlertTriangle className="text-rose-500" size={40} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white mb-4 uppercase">Node Failure</h1>
          <p className="text-white/40 max-w-xs mb-8 text-sm uppercase tracking-widest leading-loose">
            The atmospheric data processor encountered an unhandled instruction.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-transform"
          >
            <RefreshCw size={14} />
            Re-Sync System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}