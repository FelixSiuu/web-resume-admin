'use client'

import { useEffect } from 'react'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Form, Input, Select, Space, message } from 'antd'
import useContactHooks from '@/hooks/useContactHooks'
import type { ContactDto } from '@/services/myInfo.service'

const socialPlatformOptions: Array<{ label: string; value: SocialLinkPlatform }> = [
  { label: 'GitHub', value: 'github' },
  { label: 'LinkedIn', value: 'linkedin' }
]

type SocialLinkFormItem = {
  key: SocialLinkPlatform
  url: string
  isPublic: boolean
}

type ContactFormValues = {
  displayName: string
  title: string
  email: string
  phone: string
  address: string
  publicMap: Record<string, boolean>
  socialLinks: SocialLinkFormItem[]
}

const fixedFields: Array<{ key: keyof Pick<ContactFormValues, 'displayName' | 'title' | 'email' | 'phone' | 'address'>; label: string; required?: boolean; isTextArea?: boolean }> = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'title', label: 'Title' },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address', isTextArea: true }
]

const getDefaultFormValues = (): ContactFormValues => ({
  displayName: '',
  title: '',
  email: '',
  phone: '',
  address: '',
  publicMap: {
    displayName: false,
    title: false,
    email: false,
    phone: false,
    address: false
  },
  socialLinks: []
})

const toFormValues = (contact?: Contact): ContactFormValues => {
  if (!contact) return getDefaultFormValues()

  const defaultValues = getDefaultFormValues()
  const socialLinks = Object.entries(contact.socialLinks || {})
    .filter(([key]) => key === 'github' || key === 'linkedin')
    .map(([key, url]) => ({
      key: key as SocialLinkPlatform,
      url,
      isPublic: Boolean(contact.publicMap?.[key])
    }))

  return {
    displayName: contact.displayName || '',
    title: contact.title || '',
    email: contact.email || '',
    phone: contact.phone || '',
    address: contact.address || '',
    publicMap: {
      ...defaultValues.publicMap,
      ...contact.publicMap
    },
    socialLinks
  }
}

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ContactCard() {
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm<ContactFormValues>()
  const { data, isLoading, updateContact, isUpdateLoading } = useContactHooks()

  useEffect(() => {
    form.setFieldsValue(toFormValues(data))
  }, [data, form])

  const handleSave = async (values: ContactFormValues) => {
    const socialLinkItems = values.socialLinks
      .map((item) => ({
        key: item.key,
        url: item.url.trim(),
        isPublic: item.isPublic
      }))
      .filter((item) => item.key && item.url)

    const socialLinks: SocialLinks | null = socialLinkItems.length ? Object.fromEntries(socialLinkItems.map((item) => [item.key, item.url])) : null

    const socialPublicMap: PublicMap = Object.fromEntries(socialLinkItems.map((item) => [item.key, item.isPublic]))

    const postBody: ContactDto = {
      displayName: toNullable(values.displayName),
      title: toNullable(values.title),
      email: values.email.trim(),
      phone: toNullable(values.phone),
      address: toNullable(values.address),
      socialLinks,
      publicMap: {
        displayName: Boolean(values.publicMap.displayName),
        title: Boolean(values.publicMap.title),
        email: Boolean(values.publicMap.email),
        phone: Boolean(values.publicMap.phone),
        address: Boolean(values.publicMap.address),
        ...socialPublicMap
      }
    }

    try {
      await updateContact(postBody)
      messageApi.success('Contact updated successfully!')
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message)
      }
    }
  }

  return (
    <section>
      {contextHolder}

      <Card loading={isLoading}>
        <Form<ContactFormValues> form={form} layout="vertical" initialValues={getDefaultFormValues()} onFinish={handleSave} disabled={isUpdateLoading}>
          {fixedFields.map((field) => (
            <div key={field.key} className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-center md:gap-4">
              <Form.Item label={field.label} name={field.key} rules={field.key === 'email' ? [{ type: 'email', message: 'Please input a valid email!' }] : undefined}>
                {field.isTextArea ? <Input.TextArea autoSize={{ minRows: 2 }} /> : <Input />}
              </Form.Item>

              <Form.Item name={['publicMap', field.key]} valuePropName="checked" className="mb-0!">
                <Checkbox>Public</Checkbox>
              </Form.Item>
            </div>
          ))}

          <div className="mb-4">
            <h3 className="text-lg font-medium">Social Links</h3>
          </div>

          <Form.List name="socialLinks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="mb-3 mr-3 flex" align="start">
                    <Form.Item
                      {...restField}
                      name={[name, 'key']}
                      label="Platform"
                      rules={[
                        { required: true, message: 'Please input platform!' },
                        {
                          validator: async (_, value: string) => {
                            if (!value) return
                            if (value !== 'github' && value !== 'linkedin') {
                              throw new Error('Platform must be github or linkedin!')
                            }

                            const socialLinks = form.getFieldValue('socialLinks') || []
                            const duplicateCount = socialLinks.filter((item: SocialLinkFormItem) => item.key === value).length

                            if (duplicateCount > 1) {
                              throw new Error('Platform key must be unique!')
                            }
                          }
                        }
                      ]}
                    >
                      <Select options={socialPlatformOptions} placeholder="Select platform" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'url']}
                      label="URL"
                      rules={[
                        { required: true, message: 'Please input URL!' },
                        {
                          validator: async (_, value: string) => {
                            if (!value) return
                            if (!isValidHttpUrl(value.trim())) {
                              throw new Error('Please input a valid http/https URL!')
                            }
                          }
                        }
                      ]}
                    >
                      <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'isPublic']} label="Public" valuePropName="checked">
                      <Checkbox />
                    </Form.Item>

                    <Button danger type="text" icon={<MinusCircleOutlined />} onClick={() => remove(name)} className="mt-[30px]">
                      Remove
                    </Button>
                  </Space>
                ))}

                <Form.Item>
                  <Button type="dashed" onClick={() => add({ key: 'github', url: '', isPublic: false })} icon={<PlusOutlined />}>
                    Add social link
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item className="mb-0 justify-center flex">
            <Button type="primary" htmlType="submit" size="large" className="mx-auto min-w-50" loading={isUpdateLoading}>
              Save Contact
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </section>
  )
}
