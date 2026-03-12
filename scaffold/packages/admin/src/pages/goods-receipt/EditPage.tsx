import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Truck, Save, Package } from "lucide-react"
import { ObjectPage } from "@/components/admin-ui/object-page"
import {
  EditableTable,
  TableInput,
  TableText,
  type EditableTableColumn,
} from "@/components/admin-ui/editable-table"

interface GrEditItem {
  id: string
  lineNo: string
  material: string
  description: string
  orderedQty: number
  receivedQty: number
  unit: string
  batch: string
}

const mockDetail = {
  id: "1",
  grNumber: "GR-2024-0056",
  poRef: "PO-2024-0089",
  status: "inspecting",
  supplier: "Apple 授权经销商",
  plant: "1000",
  plantName: "上海工厂",
  storageLocation: "WH01",
  storageName: "主仓库",
  receivedAt: "2024-01-25 14:30",
  receiver: "王五",
  items: [
    { id: "1", lineNo: "10", material: "M-1001", description: 'MacBook Pro 14" M3 Pro', orderedQty: 5, receivedQty: 5, unit: "台", batch: "BATCH001" },
    { id: "2", lineNo: "20", material: "M-1002", description: 'MacBook Pro 14" M3 Max', orderedQty: 5, receivedQty: 5, unit: "台", batch: "BATCH002" },
  ] as GrEditItem[],
}

export function EditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<GrEditItem[]>(mockDetail.items)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
    navigate(`/goods-receipt/${id}`)
  }

  const updateItem = (
    itemId: string,
    field: keyof GrEditItem,
    value: number | string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }

  const columns: EditableTableColumn<GrEditItem>[] = [
    {
      key: "lineNo",
      title: "行号",
      width: 60,
      render: (record) => (
        <TableText variant="muted">{record.lineNo}</TableText>
      ),
    },
    {
      key: "material",
      title: "物料",
      width: 100,
      render: (record) => (
        <TableText variant="primary">{record.material}</TableText>
      ),
    },
    {
      key: "description",
      title: "描述",
      width: 200,
      render: (record) => <TableText>{record.description}</TableText>,
    },
    {
      key: "orderedQty",
      title: "订单数量",
      width: 100,
      align: "right",
      render: (record) => (
        <span>
          <TableText variant="muted">{record.orderedQty}</TableText>
          <TableText variant="muted" className="ml-1 text-xs">
            {record.unit}
          </TableText>
        </span>
      ),
    },
    {
      key: "receivedQty",
      title: "收货数量",
      width: 120,
      align: "right",
      required: true,
      render: (record) => (
        <div className="flex items-center justify-end gap-1">
          <TableInput
            type="number"
            value={record.receivedQty}
            onChange={(val) =>
              updateItem(record.id, "receivedQty", Number(val))
            }
            min={0}
            max={record.orderedQty}
            align="right"
            className="w-20"
          />
          <TableText variant="muted" className="text-xs">
            {record.unit}
          </TableText>
        </div>
      ),
    },
    {
      key: "batch",
      title: "批次",
      width: 120,
      render: (record) => (
        <TableInput
          type="text"
          value={record.batch}
          onChange={(val) => updateItem(record.id, "batch", val)}
          className="w-28"
        />
      ),
    },
  ]

  return (
    <ObjectPage
      mode="edit"
      backPath={`/goods-receipt/${id}`}
      breadcrumb="收货管理"
      title={mockDetail.grNumber}
      subtitle={`参考: ${mockDetail.poRef}`}
      status={{ label: "检验中", color: "yellow" }}
      headerIcon={<Truck className="h-5 w-5" />}
      headerFields={[
        { label: "收货日期", value: mockDetail.receivedAt.split(" ")[0] },
        { label: "收货人", value: mockDetail.receiver },
        { label: "供应商", value: mockDetail.supplier },
      ]}
      showSectionNav={false}
      sections={[
        {
          id: "storage",
          title: "库存信息",
          icon: <Package className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">工厂</p>
                <p className="text-sm">
                  {mockDetail.plant} - {mockDetail.plantName}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">存储位置</p>
                <p className="text-sm">
                  {mockDetail.storageLocation} - {mockDetail.storageName}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "items",
          title: "收货明细",
          subtitle: "可修改收货数量",
          content: (
            <EditableTable<GrEditItem>
              showIndex={false}
              rowKey="id"
              dataSource={items}
              minWidth={700}
              columns={columns}
              embedded
            />
          ),
        },
      ]}
      actions={[
        {
          key: "cancel",
          label: "取消",
          variant: "secondary",
          onClick: () => navigate(`/goods-receipt/${id}`),
          showInModes: ["edit"],
          position: "footer",
        },
        {
          key: "save",
          label: saving ? "保存中..." : "保存",
          icon: <Save className="h-4 w-4" />,
          variant: "primary",
          onClick: handleSave,
          loading: saving,
          showInModes: ["edit"],
          position: "footer",
          showDropdown: true,
        },
      ]}
    />
  )
}

export default EditPage
