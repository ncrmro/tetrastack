import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  ProjectPriority,
  ProjectStatus,
  SelectProject,
} from '@/database/schema.projects'
import { PriorityIndicator } from './PriorityIndicator'
import { StatusBadge } from './StatusBadge'

interface ProjectCardProps {
  project: SelectProject & {
    tags?: Array<{ id: string; name: string; color: string }>
  }
  showTeam?: boolean
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      data-testid="project-card"
      className="block"
    >
      <Card
        padded={false}
        rounded="lg"
        className="p-4 transition-colors hover:bg-surface-variant/50"
      >
        <CardHeader className="mb-3 p-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle as="h3" className="text-lg font-semibold truncate">
                {project.title}
              </CardTitle>
              {project.description && (
                <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <PriorityIndicator
              priority={project.priority as ProjectPriority}
              showLabel={false}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={project.status as ProjectStatus} />

            {project.tags && project.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                    +{project.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {project.createdAt && (
            <div className="mt-3 text-xs text-on-surface-variant">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
