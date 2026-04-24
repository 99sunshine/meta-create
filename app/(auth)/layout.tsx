import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MetaCreate",
};

// Auth pages manage their own full-screen layout independently.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
