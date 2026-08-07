import "./globals.css";

export const metadata = {
  title: "Seva Board — HKM Vizag",
  description: "Temple seva task coordination for Hare Krishna Movement, Visakhapatnam",
  manifest: "/manifest.json",
  applicationName: "Seva Board",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Seva Board",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#25284A",
  width: "device-width",
  initialScale: 1,
  // Allow the app to extend under the notch on iOS when installed to the home screen.
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
