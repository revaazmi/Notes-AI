import { Card } from "@/components/ui/Card";

interface ReminderCardProps {
  title: string;
  time: string;
  noteTitle: string;
  priority: "high" | "medium" | "low";
}

const priorityColors: Record<ReminderCardProps["priority"], string> = {
  high: "bg-semantic-error",
  medium: "bg-semantic-warning",
  low: "bg-semantic-success",
};

export function ReminderCard({ title, time, noteTitle, priority }: ReminderCardProps) {
  return (
    <Card variant="agent-tile" className="flex items-center gap-md">
      <div className={`h-2 w-2 shrink-0 rounded-full ${priorityColors[priority]}`} aria-label={`Priority: ${priority}`} title={priority} />
      <div className="flex-1">
        <p className="text-body-sm font-medium text-charcoal">{title}</p>
        <p className="text-body-sm text-stone">{noteTitle}</p>
      </div>
      <span className="shrink-0 text-body-sm text-steel">{time}</span>
    </Card>
  );
}
