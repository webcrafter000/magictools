import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-4 max-w-md">{description}</p>
      {action}
    </div>
  );
}