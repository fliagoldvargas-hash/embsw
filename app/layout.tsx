import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gmswap.fun"),
  title: "GM SWAP",
  description: "Best-route Solana swaps for memecoin traders. Swap fast, stay in control, and track verified XP after $GM launch.",
  openGraph: {
    title: "GM SWAP",
    description: "Best-route Solana swaps for memecoin traders. Swap fast, stay in control, and track verified XP after $GM launch.",
    url: "https://gmswap.fun",
    siteName: "GM SWAP",
    images: [
      {
        url: "/assets/gm-swap-logo.png",
        width: 1024,
        height: 1024,
        alt: "GM SWAP logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "GM SWAP",
    description: "Best-route Solana swaps for memecoin traders.",
    images: ["/assets/gm-swap-logo.png"],
  },
  icons: {
    icon: "/assets/gm-swap-logo.png"
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
