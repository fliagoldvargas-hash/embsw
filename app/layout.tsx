import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://emberswap.pro"),
  title: "Ember Swap",
  description: "Best-route Solana swaps for memecoin traders. Swap fast, stay in control, and track verified XP after $EMBER launch.",
  openGraph: {
    title: "Ember Swap",
    description: "Best-route Solana swaps for memecoin traders. Swap fast, stay in control, and track verified XP after $EMBER launch.",
    url: "https://emberswap.pro",
    siteName: "Ember Swap",
    images: [
      {
        url: "/assets/ember-swap-logo.png",
        width: 1024,
        height: 1024,
        alt: "Ember Swap logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ember Swap",
    description: "Best-route Solana swaps for memecoin traders.",
    images: ["/assets/ember-swap-logo.png"],
  },
  icons: {
    icon: "/assets/ember-swap-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
