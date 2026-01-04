
import type { Metadata, Viewport } from 'next';
import { PT_Sans } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase';
import './globals.css';
import { Suspense } from 'react';
import { DesktopAccessGate } from '@/components/DesktopAccessGate';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const APP_NAME = "Secure Talk";
const APP_DEFAULT_TITLE = "Secure Talk";
const APP_TITLE_TEMPLATE = "%s - Secure Talk";
const APP_DESCRIPTION = "A secure real-time messaging application.";
const GA_MEASUREMENT_ID = "G-1KKYCS4V7C";


export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#021425" },
  ],
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('touchmove', function(event) {
                  if (event.touches.length > 1) {
                    event.preventDefault();
                  }
                }, { passive: false });
              `,
            }}
          />
      </head>
      <body className={`${ptSans.variable} font-body antialiased h-full`}>
        <Suspense>
          {GA_MEASUREMENT_ID && (
            <>
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              />
              <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          )}
        </Suspense>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <DesktopAccessGate>
              <div className="h-full md:max-w-md md:mx-auto md:border-x flex flex-col overflow-hidden">
                {children}
              </div>
            </DesktopAccessGate>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
