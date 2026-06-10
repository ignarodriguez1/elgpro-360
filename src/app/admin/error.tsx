"use client";

import { ErrorView } from "@/components/shared/ErrorView";

export default function AdminError({
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
      scope="admin"
      homeHref="/admin"
      homeLabel="Ir al panel"
    />
  );
}
