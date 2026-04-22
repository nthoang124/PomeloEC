"use client";

import React from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AppHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/40 border-b border-white/40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-extrabold text-2xl flex items-center gap-2"
        >
          <span
            className="text-3xl"
            style={{ filter: "hue-rotate(120deg) brightness(1.2)" }}
          >
            🍉
          </span>
          Pomelo<span className="text-[#10B981]">EC</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/search"
            className="font-semibold text-gray-700 hover:text-black"
          >
            Tìm kiếm
          </Link>
          <Link
            href="/checkout"
            className="font-semibold text-gray-700 hover:text-black"
          >
            Thanh toán
          </Link>

          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300/50">
            {status === "loading" ? (
              <div className="w-20 h-8 bg-gray-200/50 animate-pulse rounded-full"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">
                  Xin chào,{" "}
                  <span className="text-[#F43F5E]">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 rounded-full text-sm font-bold bg-white/60 hover:bg-white text-gray-800 transition-colors border border-white/80 shadow-sm"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("keycloak")}
                className="px-5 py-2 rounded-full text-sm font-bold text-white shadow-sm transition-colors"
                style={{ background: "var(--color-matcha)" }}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
