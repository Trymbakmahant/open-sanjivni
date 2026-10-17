import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AnonAadhaarWrapper } from '@/providers/AnonAadhaarWrapper';

export const metadata: Metadata = {
  title: 'Open Sanjivni | Live Emergency Medical Radar on Arkiv DB-Chain',
  description:
    'Open Sanjivni: Censorship-resistant, decentralized emergency medical inventory radar. Live time-scoped broadcasts of rare blood groups (O-Neg), anti-venom, and Jan Aushadhi generic medicines with protocol-level 4-hour auto-expiration.',
  keywords: [
    'Arkiv DB-Chain',
    'Tiramisu Testnet',
    'Emergency Blood Bank',
    'Jan Aushadhi',
    'Anti-Venom',
    'Decentralized Healthcare',
    'India Public Goods',
    'Devcon 8 Mumbai',
    'Anon Aadhaar',
    'Zero Knowledge',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AnonAadhaarWrapper>
          {children}
        </AnonAadhaarWrapper>
      </body>
    </html>
  );
}
