"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { NextIntlClientProvider } from "next-intl";
import { type Locale, defaultLocale, locales, isRtl, getMessages } from "@/lib/i18n";

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
    locale: defaultLocale,
    setLocale: () => { },
});

export function useAppLocale() {
    return useContext(LocaleContext);
}

function getInitialLocale(): Locale {
    if (typeof window === "undefined") return defaultLocale;

    // Check localStorage first
    const stored = localStorage.getItem("rynk-locale");
    if (stored && locales.includes(stored as Locale)) {
        return stored as Locale;
    }

    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    if (locales.includes(browserLang as Locale)) {
        return browserLang as Locale;
    }

    return defaultLocale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);
    const [messages, setMessages] = useState<Record<string, any> | null>(null);
    const [mounted, setMounted] = useState(false);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("rynk-locale", newLocale);

        // Update HTML dir attribute for RTL
        document.documentElement.dir = isRtl(newLocale) ? "rtl" : "ltr";
        document.documentElement.lang = newLocale;
    }, []);

    // Initialize locale from localStorage/browser on mount
    useEffect(() => {
        const initial = getInitialLocale();
        setLocaleState(initial);
        document.documentElement.dir = isRtl(initial) ? "rtl" : "ltr";
        document.documentElement.lang = initial;
        setMounted(true);
    }, []);

    // Load messages when locale changes
    useEffect(() => {
        if (!mounted) return;
        getMessages(locale).then(setMessages);
    }, [locale, mounted]);

    // Don't render until we have messages
    if (!messages) {
        return null;
    }

    return (
        <LocaleContext.Provider value={{ locale, setLocale }}>
            <NextIntlClientProvider locale={locale} messages={messages}>
                {children}
            </NextIntlClientProvider>
        </LocaleContext.Provider>
    );
}
