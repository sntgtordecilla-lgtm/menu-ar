import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Menú | Menú AR',
  description: 'Explorá nuestra carta y descubrí tus próximos sabores favoritos.',
};

export const viewport: Viewport = {
  themeColor: '#fbf8f2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
