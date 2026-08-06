import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAuthConfig, isAdminEmail } from "@/lib/supabase/config";

function loginRedirect(request: NextRequest, setupRequired = false) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";

  if (setupRequired) {
    url.searchParams.set("setup", "required");
  } else {
    url.searchParams.set("next", request.nextUrl.pathname);
  }

  return NextResponse.redirect(url);
}

export async function updateAdminSession(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!hasAdminAuthConfig()) {
    return isLoginPage ? NextResponse.next() : loginRedirect(request, true);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  const isAdmin = isAdminEmail(email);

  if (!isAdmin && !isLoginPage) {
    return loginRedirect(request);
  }

  if (isAdmin && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
