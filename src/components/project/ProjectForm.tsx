'use client'

import { useEffect } from 'react'
import { Button, Card, Form, Input, InputNumber, Space, Switch, message } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useProjectDetailQuery, useProjectMutations } from '@/hooks/useProjectsHooks'
import { ProjectDto } from '@/services/myInfo.service'

type ProjectFormProps = {
  mode: 'add' | 'edit'
  slug?: string
}

type ProjectFormValues = {
  slug: string
  name: string
  value: string
  summary: string
  featured: boolean
  role?: string
  duration?: string
  challenge?: string
  solution?: string
  impact?: string
  liveUrl?: string
  repoUrl?: string
  stacks: Array<{
    stackName: string
    sortOrder?: number
  }>
}

const toNullable = (value?: string): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export default function ProjectForm({ mode, slug }: ProjectFormProps) {
  const router = useRouter()
  const [form] = Form.useForm<ProjectFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const { detail, isLoadingDetail } = useProjectDetailQuery(slug)
  const { addProject, editProject, confirmLoading } = useProjectMutations()

  useEffect(() => {
    if (mode !== 'edit' || !detail) return

    form.setFieldsValue({
      slug: detail.slug,
      name: detail.name,
      value: detail.value,
      summary: detail.summary,
      featured: detail.featured,
      role: detail.role ?? '',
      duration: detail.duration ?? '',
      challenge: detail.challenge ?? '',
      solution: detail.solution ?? '',
      impact: detail.impact ?? '',
      liveUrl: detail.liveUrl ?? '',
      repoUrl: detail.repoUrl ?? '',
      stacks: (detail.stacks ?? []).map((stackName, index) => ({
        stackName,
        sortOrder: index + 1
      }))
    })
  }, [detail, form, mode])

  const handleSubmit = async (values: ProjectFormValues) => {
    const postBody: ProjectDto = {
      slug: values.slug.trim(),
      name: values.name.trim(),
      value: values.value.trim(),
      summary: values.summary.trim(),
      featured: values.featured,
      role: toNullable(values.role),
      duration: toNullable(values.duration),
      challenge: toNullable(values.challenge),
      solution: toNullable(values.solution),
      impact: toNullable(values.impact),
      liveUrl: toNullable(values.liveUrl),
      repoUrl: toNullable(values.repoUrl),
      stacks: (values.stacks || [])
        .filter((item) => item.stackName && item.stackName.trim().length > 0)
        .map((item, index) => ({
          stackName: item.stackName.trim(),
          sortOrder: item.sortOrder ?? index + 1
        }))
    }

    try {
      if (mode === 'add') {
        await addProject(postBody)
        messageApi.success('Add success!!')
      } else {
        if (!slug) throw new Error('Missing project slug')
        await editProject({ slug, postBody })
        messageApi.success('Edit success!!')
      }
      router.push('/overview/projects')
    } catch (error) {
      if (error instanceof Error) messageApi.error(error.message)
    }
  }

  return (
    <section>
      {contextHolder}
      <Card loading={mode === 'edit' && isLoadingDetail}>
        <Form<ProjectFormValues>
          form={form}
          layout="vertical"
          disabled={confirmLoading}
          initialValues={{
            featured: false,
            stacks: [{ stackName: '', sortOrder: 1 }]
          }}
          onFinish={handleSubmit}
        >
          <Form.Item label="Slug" name="slug" rules={[{ required: true, message: 'Please input slug!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Value" name="value" rules={[{ required: true, message: 'Please input value!' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Summary" name="summary" rules={[{ required: true, message: 'Please input summary!' }]}>
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item label="Featured" name="featured" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Role" name="role">
            <Input />
          </Form.Item>
          <Form.Item label="Duration" name="duration">
            <Input />
          </Form.Item>
          <Form.Item label="Challenge" name="challenge">
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item label="Solution" name="solution">
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item label="Impact" name="impact">
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item label="Live URL" name="liveUrl" rules={[{ type: 'url', warningOnly: true, message: 'Please input valid URL' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Repo URL" name="repoUrl" rules={[{ type: 'url', warningOnly: true, message: 'Please input valid URL' }]}>
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.List name="stacks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="start" className="mb-3 flex">
                    <Form.Item {...restField} label="Stack Name" name={[name, 'stackName']} rules={[{ required: true, message: 'Please input stack name!' }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} label="Sort Order" name={[name, 'sortOrder']}>
                      <InputNumber min={1} />
                    </Form.Item>
                    <Button danger type="text" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="mt-7.5">
                      Remove
                    </Button>
                  </Space>
                ))}

                <Form.Item>
                  <Button type="dashed" onClick={() => add({ stackName: '', sortOrder: fields.length + 1 })} icon={<PlusOutlined />}>
                    Add stack
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button htmlType="button" className="mr-4" onClick={() => router.push('/overview/projects')}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={confirmLoading}>
              {mode === 'add' ? 'Create Project' : 'Save Project'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </section>
  )
}
