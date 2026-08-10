import { utils } from '@/utils'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { QuestionCircleOutlined } from '@ant-design/icons'

interface ColumnActions<T> {
  onEdit: (record: T) => void
  onDelete: (record: T) => void
}

export const getWorkingExperienceColumns = <T extends WorkingExperience>(actions: ColumnActions<T>): ColumnsType<T> => [
  // {
  //   title: 'id',
  //   dataIndex: 'id',
  //   key: 'id'
  // },
  {
    title: 'start date',
    dataIndex: 'startDate',
    key: 'startDate'
  },
  {
    title: 'end date',
    dataIndex: 'endDate',
    key: 'endDate'
  },
  {
    title: 'job title',
    dataIndex: 'jobTitle',
    key: 'jobTitle'
  },
  {
    title: 'company',
    dataIndex: 'company',
    key: 'company'
  },
  {
    title: 'location',
    dataIndex: 'location',
    key: 'location'
  },
  {
    title: 'create time',
    dataIndex: 'createTime',
    key: 'createTime',
    render: (_, record) => {
      return <>{utils.formatDateString(record.createTime)}</>
    }
  },
  {
    title: 'update time',
    dataIndex: 'updateTime',
    key: 'updateTime',
    render: (_, record) => {
      return <>{utils.formatDateString(record.updateTime)}</>
    }
  },
  {
    fixed: 'right',
    title: 'action',
    key: 'action',
    render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => actions.onEdit(record)}>
          edit
        </Button>

        <Popconfirm title="Delete the data" onConfirm={() => actions.onDelete(record)} description="Are you sure to delete?" icon={<QuestionCircleOutlined style={{ color: 'red' }} />}>
          <Button type="link" danger>
            delete
          </Button>
        </Popconfirm>
      </Space>
    )
  }
]

export const getSubTableColumns = <T extends KeyResponsibility>(): ColumnsType<T> => [
  // {
  //   title: 'id',
  //   dataIndex: 'id',
  //   key: 'id'
  // },
  // {
  //   title: 'working id',
  //   dataIndex: 'workingId',
  //   key: 'workingId'
  // },
  {
    title: 'title',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: 'responsibility',
    dataIndex: 'responsibility',
    key: 'responsibility'
  }
]
