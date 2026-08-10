import { Button, Popconfirm, Space } from 'antd'
import { ColumnType } from 'antd/es/table'
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

export const getActionColums = <T extends Education>(actions: ColumnActions<T>, isEditing: (record: T) => boolean): EditableColumnsType<T> => [
  // {
  //   title: 'id',
  //   dataIndex: 'id',
  //   key: 'id'
  // },
  {
    title: 'start date',
    dataIndex: 'startDate',
    key: 'startDate',
    editable: true
  },
  {
    title: 'end date',
    dataIndex: 'endDate',
    key: 'endDate',
    editable: true
  },
  {
    title: 'institution',
    dataIndex: 'institution',
    key: 'institution',
    editable: true
  },
  {
    title: 'degree',
    dataIndex: 'degree',
    key: 'degree',
    editable: true,
    required: false // 這裡特別標註 degree 欄位不需要必填
  },
  {
    title: 'major',
    dataIndex: 'major',
    key: 'major',
    editable: true
  },
  {
    title: 'location',
    dataIndex: 'location',
    key: 'location',
    editable: true
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
