'use client'

import React from 'react'
import { EditOutlined, LikeFilled, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Col, Listy, message, Popconfirm, Row, Spin, Switch } from 'antd'
import useProjectsHooks from '@/hooks/useProjectsHooks'
import { useRouter } from 'next/navigation'

export default function ProjectList() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()
  const { list, isLoadingList, deleteProject, confirmLoading } = useProjectsHooks()
  const [groupByFeatured, setGroupByFeatured] = React.useState(false)

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

  const ListItem = (props: Project) => {
    return (
      <Row>
        <Col flex="auto">
          <h3>
            {props.name} {props.featured ? <LikeFilled aria-label="featured" style={{ color: 'red' }} /> : null}
          </h3>
        </Col>
        <Col>
          <Button type="link" icon={<EditOutlined />} onClick={() => router.push(`/overview/projects/${props.slug}`)}>
            edit
          </Button>
        </Col>
        <Col>
          <Popconfirm title="Delete the data" onConfirm={() => onDelete(props.slug)} icon={<QuestionCircleOutlined style={{ color: 'red' }} />}>
            <Button type="link" danger disabled={confirmLoading}>
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
        <Col>
          <Switch checked={groupByFeatured} onChange={onChange} /> group by featured {groupByFeatured ? 'On' : 'Off'}
        </Col>
      </Row>

      <Listy<Project>
        items={list}
        group={
          groupByFeatured
            ? {
                key: (project) => (project.featured ? 'featured' : 'normal'),
                title: (groupKey) => (groupKey === 'featured' ? 'Featured Projects' : 'Normal Projects')
              }
            : undefined
        }
        rowKey="slug"
        itemRender={(item) => <ListItem {...item} />}
      />

      <Button type="primary" icon={<PlusOutlined />} className="mt-4" onClick={() => router.push('/overview/projects/new')}>
        Add a Project
      </Button>
    </>
  )
}
