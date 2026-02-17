import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { D1Adapter } from "@auth/d1-adapter"
import { getCloudflareContext } from "@opennextjs/cloudflare"

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
    // Get D1 binding from Cloudflare context (shared with rynk-web)
    let db: any = undefined

    try {
        const ctx = getCloudflareContext()
        db = ctx.env.DB
    } catch (error) {
        console.log('[Auth] No Cloudflare context:', error)
    }

    return {
        trustHost: true,
        adapter: db ? D1Adapter(db) : undefined,
        providers: [
            Google({
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
        ],
        callbacks: {
            async session({ session, user, token }) {
                if (session.user) {
                    if (user) {
                        session.user.id = user.id
                    } else if (token?.sub) {
                        // @ts-ignore
                        session.user.id = token.sub
                    }
                }
                return session
            },
        },
        pages: {
            signIn: '/login',
        },
    }
})
