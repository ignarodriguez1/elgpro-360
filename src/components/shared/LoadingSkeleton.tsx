interface LoadingSkeletonProps {
  variant: "card" | "timeline" | "table";
  count?: number;
}

function CardSkeleton() {
  return (
    <div className="sk-card">
      <div className="sk" style={{ height: 150, borderRadius: 12, marginBottom: 14 }} />
      <div className="sk" style={{ height: 14, width: "60%", marginBottom: 8 }} />
      <div className="sk" style={{ height: 10, width: "40%" }} />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16 }}>
          <div className="sk" style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ height: 14, width: "45%", marginBottom: 8 }} />
            <div className="sk" style={{ height: 10, width: "90%", marginBottom: 6 }} />
            <div className="sk" style={{ height: 10, width: "70%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="sk" style={{ height: 52, borderRadius: 12 }} />
      ))}
    </div>
  );
}

export function LoadingSkeleton({ variant, count = 1 }: LoadingSkeletonProps) {
  if (variant === "timeline") return <TimelineSkeleton />;
  if (variant === "table") return <TableSkeleton />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
