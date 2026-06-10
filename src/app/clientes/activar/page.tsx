import { Suspense } from "react";
import { ActivarForm } from "./ActivarForm";

export default function ActivarCuentaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted">Cargando…</p>
        </div>
      }
    >
      <ActivarForm />
    </Suspense>
  );
}
