import type { ReactNode } from "react";
import { Navbar } from "@/components/portal/Navbar";
import { Footer } from "@/components/portal/Footer";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
