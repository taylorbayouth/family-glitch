import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Family Glitch',
  description: 'A family game application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
