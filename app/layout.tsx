import type React from "react"
import type { Metadata } from "next"
import { Inter, Pacifico } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-cursive" })

export const metadata: Metadata = {
  title: "Skribble Game",
  description: "A multiplayer drawing and guessing game",
  icons: {
    icon: "/favicon.ico",
  },
}

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode
// }>) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head ><link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" /></head>
//       <body className={inter.className}>
//         <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
//           {children}
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pacifico.variable}`} suppressHydrationWarning>
      <body className="font-cursive">
        <ThemeProvider attribute="class" themes={["light", "dark"]} enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
