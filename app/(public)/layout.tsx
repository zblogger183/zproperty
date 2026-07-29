import { Suspense } from "react";
import type { ReactNode } from "react";
import { Navbar } from "@/components/portal/Navbar";
import { Footer } from "@/components/portal/Footer";
import { AuthErrorHandler } from "@/components/shared/AuthErrorHandler";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <AuthErrorHandler />
      </Suspense>
      {children}
      <Footer />
    </>
  );
}
