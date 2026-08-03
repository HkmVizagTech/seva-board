import "./globals.css";

export const metadata = {
  title: "Seva Board — HKM Vizag",
  description: "Temple seva task coordination for Hare Krishna Movement, Visakhapatnam",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
