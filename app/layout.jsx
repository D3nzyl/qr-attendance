import './globals.css';

export const metadata = {
  title: 'QR Attendance',
  description: 'Attendance and QR toolbox app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
