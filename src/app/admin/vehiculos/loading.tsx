import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function VehiculosLoading() {
  return (
    <div style={{ paddingTop: 8 }}>
      <div className="sk" style={{ height: 28, width: 180, marginBottom: 20 }} />
      <LoadingSkeleton variant="table" />
    </div>
  );
}
