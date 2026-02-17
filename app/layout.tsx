import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { ShellWrapper } from "@/components/shell-wrapper";
import "./globals.css";

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    metadataBase: new URL("https://ideas.rynk.io"),
    title: {
        default: "rynk ideas. — Dump. Organize. Act.",
        template: "%s | rynk ideas.",
    },
    description:
        "Dump your thoughts. AI organizes them into actionable plans. No structure needed — just think out loud.",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${manrope.variable} ${jetbrainsMono.variable} font-sans antialiased tracking-normal bg-background text-foreground`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    forcedTheme="dark"
                    disableTransitionOnChange
                >
                    <ShellWrapper>{children}</ShellWrapper>
                    <Toaster
                        position="top-center"
                        richColors
                        closeButton
                        toastOptions={{ duration: 5000 }}
                    />
                </ThemeProvider>
            </body>
        </html>
    );
}
