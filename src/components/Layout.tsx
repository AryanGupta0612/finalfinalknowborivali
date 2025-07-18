import React from 'react';
import Navigation from './Navigation';
import VisitorCounter from './VisitorCounter';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <VisitorCounter />
    </div>
  );
}

export default Layout;