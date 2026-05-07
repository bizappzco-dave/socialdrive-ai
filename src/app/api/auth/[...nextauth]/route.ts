import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { createClient } from "@/lib/supabase/server"

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user exists in Supabase, create if not
      const supabase = await createClient()
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!existingUser) {
        // Create new user
        await supabase.from('users').insert({
          email: user.email!,
          name: user.name,
          avatar_url: user.image,
          tier: 'solo', // Default tier
        })
      }

      return true
    },
    async jwt({ token, user, account, profile }) {
      // Add user ID to token
      if (user) {
        const supabase = await createClient()
        const { data } = await supabase
          .from('users')
          .select('id, tier')
          .eq('email', token.email!)
          .single()
        
        if (data) {
          token.id = data.id
          token.tier = data.tier
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID and tier to session
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).tier = token.tier as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})

export { handler as GET, handler as POST }
