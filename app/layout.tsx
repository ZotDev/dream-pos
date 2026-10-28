import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Dream POS — Retail, beautifully managed', description: 'A streamlined retail workspace for billing, inventory, sales, and store operations' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
