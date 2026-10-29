import ProjectForm from '@/components/project/ProjectForm'
import SectionTitle from '@/components/sectionTitle'

export default function NewProjectPage() {
  return (
    <>
      <SectionTitle>Add Project</SectionTitle>
      <ProjectForm mode="add" />
    </>
  )
}
