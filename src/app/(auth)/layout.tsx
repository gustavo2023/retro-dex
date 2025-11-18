import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-amber-500">RetroDex</h1>
        <p className="text-muted-foreground">
          Tu Colección Personal de Películas
        </p>
      </div>
      <div className="mt-6 w-full max-w-md">{children}</div>
    </div>
  );
}
