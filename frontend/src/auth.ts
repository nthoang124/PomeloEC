import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER, // ví dụ: http://localhost:8080/realms/PomeloEC
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Khi User đăng nhập thành công, Keycloak trả về account.
      // Ta khâu luôn Access Token lấy được vào token payload.
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Đẩy Access Token từ token payload ra ngoài session object
      // Để Client Components (useSession) hoặc Server Components (auth())
      // có thể lấy ra và kẹp vào Header Axios bắn xuống Backend.
      if (token.accessToken) {
        // @ts-expect-error Session types will be augmented later
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});
