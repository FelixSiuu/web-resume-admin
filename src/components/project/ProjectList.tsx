'use client'

import React from 'react'
import { HolderOutlined, LikeFilled, QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Col, Listy, message, Popconfirm, Row, Spin, Switch } from 'antd'
import useProjectsHooks from '@/hooks/useProjectsHooks'
import { ProjectDto } from '@/services/myInfo.service'

export default function ProjectList() {
  const [messageApi, contextHolder] = message.useMessage()
  const { list, isLoadingList, deleteProject, confirmLoading } = useProjectsHooks()
  const [groupByFeatured, setGroupByFeatured] = React.useState(false)
  const [modalOpen, setModalOpen] = React.useState(false)

  const onDelete = async (slug: string) => {
    try {
      await deleteProject(slug)
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message)
    }
  }

  const handleActionCallBack = async (mode: 'add' | 'edit') => {
    try {
      messageApi.success(`${mode} success!!`)
      setModalOpen(false)
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
          <Popconfirm title="Delate the data" onConfirm={() => onDelete(props.slug)} icon={<QuestionCircleOutlined style={{ color: 'red' }} />}>
            <Button type="link" danger>
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

      <Button type="primary" className="mt-4" onClick={() => setModalOpen(true)}>
        Add a Project !!
      </Button>
    </>
  )
}
