import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              RetroDex
            </p>
            <h1 className="text-xl font-semibold">Área de la aplicación</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            Placeholder layout
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-8">
        <section className="mb-6 rounded-lg border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
          <p>
            Este es un layout temporal para el grupo <code>(app)</code>. Agrega
            aquí la navegación, barras laterales o widgets globales cuando estén
            listos.
          </p>
        </section>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
