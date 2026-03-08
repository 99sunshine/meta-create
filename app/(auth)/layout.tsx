import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - MetaCreate",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  );
}
