'use client'

import React from 'react'
import { EditOutlined, LikeFilled, PlusOutlined, QuestionCircleOutlined, HolderOutlined } from '@ant-design/icons'
import { Button, Col, Listy, message, Popconfirm, Row, Spin, Switch } from 'antd'
import { useProjectListQuery, useProjectMutations } from '@/hooks/useProjectsHooks'
import { useRouter } from 'next/navigation'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function ProjectList() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const { list, isLoadingList } = useProjectListQuery()
  const { deleteProject, isDeleteLoading } = useProjectMutations()
  const [sortList, setSortList] = React.useState<Project[]>([])
  const [groupByFeatured, setGroupByFeatured] = React.useState(false)
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
    if (!over || active.id === over.id) {
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
  }

  const handleSort = () => {
    console.log(sortList.map((item) => item.slug))
  }

  const hasOrderChanged = (): boolean => {
    const originalOrder = list.map((item) => item.slug).join(',')
    const newOrder = sortList.map((item) => item.slug).join(',')
    return sortList.length > 0 && originalOrder !== newOrder
  }

  const SortableListItem: React.FC<Readonly<Project>> = (props: Project) => {
    const { slug, name, sortOrder, featured } = props
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: sortOrder })

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
      ...(isDragging ? { position: 'relative', zIndex: 1 } : {})
    }

    return (
      <Row data-shadow={isDragging} ref={setNodeRef} style={style} gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
        <Col>
          <Button type="text" size="small" icon={<HolderOutlined />} style={{ cursor: 'move' }} ref={setActivatorNodeRef} {...attributes} {...listeners} />
        </Col>
        <Col flex="auto">
          <h3>
            {name} {featured ? <LikeFilled aria-label="featured" style={{ color: 'red' }} /> : null}
          </h3>
        </Col>
        <Col>
          <Button type="link" icon={<EditOutlined />} onClick={() => router.push(`/overview/projects/${slug}`)}>
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

  return (
    <>
      {contextHolder}
      <Spin spinning={isLoadingList} fullscreen />

      <Row className="mb-4">
        <Col flex="auto">
          <Switch checked={groupByFeatured} onChange={onChange} /> group by featured {groupByFeatured ? 'On' : 'Off'}
        </Col>

        <Col>
          {hasOrderChanged() && (
            <Button type="link" onClick={() => handleSort()}>
              Save new order
            </Button>
          )}
        </Col>
      </Row>

      <DndContext id="listy-drag-sorting" sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
        <SortableContext items={showList.map((item) => item.sortOrder)} strategy={verticalListSortingStrategy}>
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
            itemRender={(item) => <SortableListItem {...item} />}
          />
        </SortableContext>
      </DndContext>

      <Button type="primary" icon={<PlusOutlined />} className="mt-4" onClick={() => router.push('/overview/projects/new')}>
        Add a Project
      </Button>
    </>
  )
}
