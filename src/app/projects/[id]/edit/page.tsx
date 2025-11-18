import { authRedirect } from '../../../auth';
import { getProjects } from '@/models/projects';
import { notFound } from 'next/navigation';
import ProjectEditClient from './ProjectEditClient';

export const dynamic = 'force-dynamic';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  await authRedirect();
  const { id } = await params;

  // Try to get project by ID first, if not found try by slug
  let projects = await getProjects({ ids: [id] });
  if (projects.length === 0) {
    projects = await getProjects({ slugs: [id] });
  }

  if (projects.length === 0) {
    notFound();
  }

  const project = projects[0];

  return <ProjectEditClient project={project} />;
}
