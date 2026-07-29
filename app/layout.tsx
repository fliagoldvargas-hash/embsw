import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://orbitswap.fun"),
  title: "Orbit Swap",
  description: "Best-route Solana swaps for memecoin traders. Swap fast, stay in control, and track verified XP after $ORBIT launch.",
  openGraph: {
    title: "Orbit Swap",
    description: "Best-route Solana swaps for memecoin traders. Swap fast, stay in control, and track verified XP after $ORBIT launch.",
    url: "https://orbitswap.fun",
    siteName: "Orbit Swap",
    images: [
      {
        url: "/assets/orbit-swap-logo.png",
        width: 1024,
        height: 1024,
        alt: "Orbit Swap logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Orbit Swap",
    description: "Best-route Solana swaps for memecoin traders.",
    images: ["/assets/orbit-swap-logo.png"],
  },
  icons: {
    icon: "/assets/orbit-swap-logo.png"
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
