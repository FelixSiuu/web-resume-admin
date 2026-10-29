'use client'

import { useParams } from 'next/navigation'
import ProjectForm from '@/components/project/ProjectForm'
import SectionTitle from '@/components/sectionTitle'

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  return (
    <>
      <SectionTitle>Edit Project</SectionTitle>
      <ProjectForm mode="edit" slug={slug} />
    </>
  )
}
