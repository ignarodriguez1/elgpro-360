import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function AdminLoading() {
  return (
    <div style={{ paddingTop: 8 }}>
      <div className="sk" style={{ height: 28, width: 200, marginBottom: 20 }} />
      <LoadingSkeleton variant="table" />
    </div>
  );
}
