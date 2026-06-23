import { AdminPageSkeleton } from "@/components/shared/RouteSkeletons";

// Fallback de carga para /admin y todo segmento admin sin loading.tsx propio.
export default function Loading() {
  return <AdminPageSkeleton />;
}
