import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel довіряє хосту автоматично, але явно вмикаємо і для інших середовищ
  trustHost: true,
  providers: [
    // Вхід через email + пароль
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email as string });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return { id: user._id.toString(), name: user.name, email: user.email, image: user.avatar };
      },
    }),
    // Вхід через Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === 'credentials') {
        // Звичайний вхід email+пароль — id вже наш, із колекції User
        token.sub = user.id;
      } else if (account && account.provider !== 'credentials') {
        // Вхід через соцмережу — знаходимо чи створюємо користувача
        // в нашій же колекції User (за email), щоб профіль/обране/чат
        // працювали однаково незалежно від способу входу
        await connectDB();
        const email = token.email;
        if (email) {
          let dbUser = await User.findOne({ email });
          if (!dbUser) {
            dbUser = await User.create({
              name: token.name || 'Користувач',
              email,
              avatar: token.picture || '',
              provider: account.provider,
            });
          }
          token.sub = dbUser._id.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub as string;
      return session;
    },
  },
});
