import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel Admina C++',
  description: 'Zdalne sprawdzanie statusu C++',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0a0a', color: '#f0f0f0' }}>{children}</body>
    </html>
  );
}
