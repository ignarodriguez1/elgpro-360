"use client";

import { ErrorView } from "@/components/shared/ErrorView";

export default function ClientesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      error={error}
      reset={reset}
      scope="clientes"
      homeHref="/clientes/dashboard"
      homeLabel="Ir a mi panel"
    />
  );
}
