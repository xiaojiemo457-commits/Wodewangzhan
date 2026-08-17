import type { ReactNode } from 'react';
import MouseEffect from '../effects/MouseEffect';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative">
      <MouseEffect />
      <Header />
      <main className="relative z-10 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
