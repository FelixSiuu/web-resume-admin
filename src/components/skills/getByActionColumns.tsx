import { utils } from '@/utils'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnType } from 'antd/es/table'
import { QuestionCircleOutlined } from '@ant-design/icons'

interface ColumnActions<T> {
  onEdit: (record: T) => void
  onDelete: (key: number) => void
  onSave: (key: number) => void
  onCancel: (record: T) => void
}

// 🎯 利用 Omit 抽離原有的 onCell，並自己精準宣告擴充後的結構
export type EditableColumnType<T> = Omit<ColumnType<T>, 'onCell'> & {
  isLongText?: boolean // 是否長文字？是：使用textArea
  editable?: boolean // 是否可編輯
  dataIndex?: string
  required?: boolean
  title?: React.ReactNode // 確保 map 內讀取 title 時型別相容
  onCell?: (record: T) => React.HTMLAttributes<HTMLElement> // 👈 關鍵：綁定你的 Data 泛型
}

export type EditableColumnsType<T> = EditableColumnType<T>[]

export const getActionColums = <T extends CoreSkill>(actions: ColumnActions<T>, isEditing: (record: T) => boolean): EditableColumnsType<T> => [
  // {
  //   title: 'id',
  //   dataIndex: 'id',
  //   key: 'id'
  // },
  {
    title: 'summary',
    dataIndex: 'summary',
    key: 'summary',
    editable: true
  },
  {
    title: 'details',
    dataIndex: 'details',
    key: 'details',
    editable: true,
    isLongText: true
  },
  {
    title: 'create time',
    dataIndex: 'createTime',
    key: 'createTime',
    render: (_, record) => {
      return <>{!!record.createTime && utils.formatDateString(record.createTime)}</>
    }
  },
  {
    title: 'update time',
    dataIndex: 'updateTime',
    key: 'updateTime',
    render: (_, record) => {
      return <>{!!record.updateTime && utils.formatDateString(record.updateTime)}</>
    }
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => {
      const editing = isEditing(record)
      return editing ? (
        <Space size="small">
          <Button type="primary" onClick={() => actions.onSave(record.id)}>
            Save
          </Button>

          <Popconfirm title="Sure to cancel?" onConfirm={() => actions.onCancel(record)}>
            <Button>Cancel</Button>
          </Popconfirm>
        </Space>
      ) : (
        <Space>
          <Button type="link" onClick={() => actions.onEdit(record)}>
            Edit
          </Button>

          <Popconfirm title="Delete the data" onConfirm={() => actions.onDelete(record.id)} description="Are you sure to delete?" icon={<QuestionCircleOutlined style={{ color: 'red' }} />}>
            <Button type="link" danger>
              delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  }
]
