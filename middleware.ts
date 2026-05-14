import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (url.hostname === "book.plankpest.com" && url.pathname === "/") {
    return NextResponse.redirect(new URL("/book", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
