'use client'

import React from 'react'
import { EditOutlined, LikeFilled, PlusOutlined, QuestionCircleOutlined, HolderOutlined } from '@ant-design/icons'
import { Button, Col, Empty, Listy, message, Popconfirm, Row, Spin, Switch } from 'antd'
import { useProjectListQuery, useProjectMutations } from '@/hooks/useProjectsHooks'
import { useRouter } from 'next/navigation'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ProjectRowProps = Project & {
  sortingEnabled: boolean
  isDeleteLoading: boolean
  onEdit: (slug: string) => void
  onDelete: (slug: string) => void
}

function ProjectRow({ slug, name, sortOrder, featured, sortingEnabled, isDeleteLoading, onEdit, onDelete }: ProjectRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: sortOrder,
    disabled: !sortingEnabled
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 1 } : {})
  }

  return (
    <Row data-shadow={isDragging} ref={setNodeRef} style={style} gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      {sortingEnabled ? (
        <Col>
          <Button type="text" size="small" icon={<HolderOutlined />} style={{ cursor: 'move' }} ref={setActivatorNodeRef} {...attributes} {...listeners} />
        </Col>
      ) : null}
      <Col flex="auto">
        <h3>
          {name} {featured ? <LikeFilled aria-label="featured" style={{ color: 'red' }} /> : null}
        </h3>
      </Col>
      <Col>
        <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(slug)}>
          edit
        </Button>
      </Col>
      <Col>
        <Popconfirm title="Delete the data" onConfirm={() => onDelete(slug)} icon={<QuestionCircleOutlined style={{ color: 'red' }} />}>
          <Button type="link" danger disabled={isDeleteLoading}>
            delete
          </Button>
        </Popconfirm>
      </Col>
    </Row>
  )
}

export default function ProjectList() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const { list, isLoadingList } = useProjectListQuery()
  const { deleteProject, reorderProjects, isDeleteLoading, isReorderLoading } = useProjectMutations()
  const [sortList, setSortList] = React.useState<Project[]>([])
  const [groupByFeatured, setGroupByFeatured] = React.useState(false)
  const sortingEnabled = !groupByFeatured
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 1 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const showList = sortList.length ? sortList : list

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!sortingEnabled || !over || active.id === over.id) {
      return
    }
    const newList = arrayMove(
      showList,
      showList.findIndex((item) => item.sortOrder === active.id),
      showList.findIndex((item) => item.sortOrder === over.id)
    )
    setSortList(newList)
  }

  const onDelete = async (slug: string) => {
    try {
      await deleteProject(slug)
      messageApi.success('Delete success!!')
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message)
    }
  }

  const onChange = (checked: boolean) => {
    setGroupByFeatured(checked)
    if (checked) {
      setSortList([])
    }
  }

  const handleSort = async () => {
    try {
      await reorderProjects({
        slugs: sortList.map((item) => item.slug)
      })
      setSortList([])
      messageApi.success('Reorder success!!')
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message)
    }
  }

  const hasOrderChanged = (): boolean => {
    if (!sortingEnabled || sortList.length === 0) return false
    const originalOrder = list.map((item) => item.slug).join(',')
    const newOrder = sortList.map((item) => item.slug).join(',')
    return originalOrder !== newOrder
  }

  const listContent = (
    <SortableContext items={showList.map((item) => item.sortOrder)} strategy={verticalListSortingStrategy} disabled={!sortingEnabled}>
      <Listy<Project>
        items={showList}
        group={
          groupByFeatured
            ? {
                key: (project) => (project.featured ? 'featured' : 'normal'),
                title: (groupKey) => (groupKey === 'featured' ? 'Featured Projects' : 'Normal Projects')
              }
            : undefined
        }
        rowKey="slug"
        itemRender={(item) => (
          <ProjectRow
            {...item}
            sortingEnabled={sortingEnabled}
            isDeleteLoading={isDeleteLoading}
            onEdit={(slug) => router.push(`/overview/projects/${slug}`)}
            onDelete={(slug) => void onDelete(slug)}
          />
        )}
      />
    </SortableContext>
  )

  return (
    <>
      {contextHolder}

      {isLoadingList ? <Spin /> : null}

      {!isLoadingList && showList.length === 0 ? <Empty className="my-8" description="No projects yet" /> : null}

      {showList.length > 0 ? (
        <Row className="mb-4">
          <Col flex="auto">
            <Switch checked={groupByFeatured} onChange={onChange} /> group by featured {groupByFeatured ? 'On' : 'Off'}
          </Col>

          <Col>
            {hasOrderChanged() && (
              <Button type="link" onClick={() => void handleSort()} loading={isReorderLoading}>
                Save new order
              </Button>
            )}
          </Col>
        </Row>
      ) : null}

      {showList.length > 0 ? (
        sortingEnabled ? (
          <DndContext id="listy-drag-sorting" sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            {listContent}
          </DndContext>
        ) : (
          listContent
        )
      ) : null}

     <p>
      <Button type="primary" icon={<PlusOutlined />} className="mt-4" onClick={() => router.push('/overview/projects/new')}>
        Add a Project
      </Button>
     </p>
    </>
  )
}
