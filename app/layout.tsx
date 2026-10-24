import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Dream POS — Retail Management', description: 'Dream POS retail management starter application' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
