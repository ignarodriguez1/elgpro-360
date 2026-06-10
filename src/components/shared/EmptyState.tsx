import Link from "next/link";
import { Icon, type IconName } from "./Icon";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

/** Estado vacío reutilizable (coherente con los tokens del prototipo). */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-ic">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary btn-sm empty-state-cta">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
