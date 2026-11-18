import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
          <h1 className="font-display text-2xl font-bold">কিছু একটা সমস্যা হয়েছে</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            পেজটি পুনরায় লোড করুন। সমস্যাটি থেকে গেলে আমাদের হেল্পলাইন 01331496395 নম্বরে যোগাযোগ
            করুন।
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-gradient-primary px-6 py-2.5 font-display text-sm font-bold text-primary-foreground"
          >
            পেজ রিলোড করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
