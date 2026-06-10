"use client";

import { ErrorView } from "@/components/shared/ErrorView";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView error={error} reset={reset} scope="public" homeHref="/" />;
}
