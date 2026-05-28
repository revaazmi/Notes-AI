import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface NoteCardProps {
  id: string;
  title: string;
  preview: string;
  category: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: { id: string; name: string; color: string }[];
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
}

export function NoteCard({ id, title, preview, category, updatedAt, pinned, tags, selected, onSelectChange }: NoteCardProps) {
  return (
    <div className="group relative">
      {onSelectChange ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectChange(!selected)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectChange(!selected); } }}
        >
          <Card variant="base" className={`cursor-pointer transition-shadow hover:shadow-card ${selected ? "ring-2 ring-primary" : ""}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={!!selected}
                onChange={() => {}}
                className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded-md border-2 border-hairline-strong checked:border-primary checked:bg-primary checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M16.59%205.58L8%2014.17l-3.59-3.58L3%2012l5%205%2010-10z%22%2F%3E%3C%2Fsvg%3E')] bg-center bg-no-repeat bg-[length:14px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer pointer-events-none"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-heading-5 text-charcoal flex items-center gap-1.5 truncate">
                      {pinned && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                        </svg>
                      )}
                      <span className="truncate">{title}</span>
                    </h3>
                    <Badge variant="tag-purple" className="shrink-0">{category}</Badge>
                  </div>
                  <p className="line-clamp-2 text-body-sm text-slate">{preview}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body-sm text-stone">{updatedAt}</span>
                    {tags && tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: t.color + "20", color: t.color }}
                          >
                            {t.name}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="text-[11px] text-muted">+{tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Link href={`/notes/${id}`}>
          <Card variant="base" className="cursor-pointer transition-shadow hover:shadow-card">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-heading-5 text-charcoal flex items-center gap-1.5 truncate">
                      {pinned && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                        </svg>
                      )}
                      <span className="truncate">{title}</span>
                    </h3>
                    <Badge variant="tag-purple" className="shrink-0">{category}</Badge>
                  </div>
                  <p className="line-clamp-2 text-body-sm text-slate">{preview}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body-sm text-stone">{updatedAt}</span>
                    {tags && tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: t.color + "20", color: t.color }}
                          >
                            {t.name}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="text-[11px] text-muted">+{tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}
