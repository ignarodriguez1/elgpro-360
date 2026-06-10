import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function AuditoriaLoading() {
  return (
    <div style={{ paddingTop: 8 }}>
      <div className="sk" style={{ height: 28, width: 160, marginBottom: 20 }} />
      <LoadingSkeleton variant="table" />
    </div>
  );
}
