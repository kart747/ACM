import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARTSCAPE',
  description:
    'Step inside the relationships that make art meaningful: follow a detail from one human-made artwork to another.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
