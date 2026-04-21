import { auth } from "@/auth";

// Export auth config làm Next.js Middleware
// Hàm auth này sẽ kiểm tra Session (OIDC Token) trên mọi request khớp với matcher.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Cấu hình các route BẮT BUỘC có token.
  // Ở đây chặn truy cập vào Dashboard Seller hoặc Hồ sơ người dùng.
  const isProtectedRoute =
    pathname.startsWith("/account") ||
    pathname.startsWith("/seller-dashboard") ||
    pathname.startsWith("/checkout");

  if (isProtectedRoute && !isLoggedIn) {
    // Chuyển hướng ra trang mồi của auth.js, nó sẽ tự đẩy qua SSO Keycloak
    return Response.redirect(new URL("/api/auth/signin", req.nextUrl));
  }
});

// Cấu hình Matcher chỉ định file middleware này sẽ chạy trên những route nào
export const config = {
  // Áp dụng lên mọi trang, ngoại trừ ảnh static, next resources, api (để ko dập JWT route)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
