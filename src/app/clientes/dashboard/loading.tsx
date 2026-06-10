import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div style={{ paddingTop: 8 }}>
      <div className="sk" style={{ height: 26, width: 220, marginBottom: 20 }} />
      <LoadingSkeleton variant="card" count={2} />
    </div>
  );
}
