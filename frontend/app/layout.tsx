import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import "./soc5-adminkit.css"
import "./soc5.css"

export const metadata: Metadata = {
  title: "SOC5 Outbound Operations",
  description: "Outbound request management and operations dashboard",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ThemeProvider defaultTheme="light" storageKey="tasko-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
