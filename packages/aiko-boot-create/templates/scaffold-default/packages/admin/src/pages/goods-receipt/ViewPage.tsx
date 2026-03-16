import { useNavigate, useParams } from "react-router"
import { Truck, Pencil, Package, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { ObjectPage } from "@/components/admin-ui/object-page"
import {
  EditableTable,
  TableText,
  type EditableTableColumn,
} from "@/components/admin-ui/editable-table"
import { TableRow, TableCell } from "@/components/ui/table"

interface GrItem {
  id: string
  lineNo: string
  material: string
  description: string
  orderedQty: number
  receivedQty: number
  unit: string
  batch: string
  inspectionResult: string
}

const mockDetail = {
  id: "1",
  grNumber: "GR-2024-0056",
  poRef: "PO-2024-0089",
  status: "received",
  supplier: "Apple 授权经销商",
  supplierCode: "VD-001",
  plant: "1000",
  plantName: "上海工厂",
  storageLocation: "WH01",
  storageName: "主仓库",
  receivedAt: "2024-01-25 14:30",
  receiver: "王五",
  movementType: "101",
  movementTypeName: "采购收货",
  deliveryNote: "DN-2024-1234",
  billOfLading: "BL-20240125",
  items: [
    { id: "1", lineNo: "10", material: "M-1001", description: 'MacBook Pro 14" M3 Pro', orderedQty: 5, receivedQty: 5, unit: "台", batch: "BATCH001", inspectionResult: "合格" },
    { id: "2", lineNo: "20", material: "M-1002", description: 'MacBook Pro 14" M3 Max', orderedQty: 5, receivedQty: 5, unit: "台", batch: "BATCH002", inspectionResult: "合格" },
  ] as GrItem[],
  totalOrdered: 10,
  totalReceived: 10,
  history: [
    { status: "green", title: "收货完成", time: "2024-01-25 14:30", desc: "王五 完成收货入库，共10件物料" },
    { status: "purple", title: "质量检验", time: "2024-01-25 12:00", desc: "质检员 检验所有物料，结果：全部合格" },
    { status: "amber", title: "货物到达", time: "2024-01-25 10:00", desc: "仓库确认货物到达，开始卸货" },
    { status: "gray", title: "收货单创建", time: "2024-01-24 16:00", desc: "系统基于采购订单 PO-2024-0089 自动创建" },
  ],
}

export function ViewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const data = mockDetail
  const receivedPercent = Math.round((data.totalReceived / data.totalOrdered) * 100)

  const lineColumns: EditableTableColumn<GrItem>[] = [
    {
      key: "lineNo",
      title: "行号",
      width: 60,
      render: (record) => <TableText variant="muted">{record.lineNo}</TableText>,
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
      width: 100,
      align: "right",
      render: (record) => {
        const isFullyReceived = record.receivedQty === record.orderedQty
        return (
          <span>
            <span
              className={cn(
                "text-sm font-medium",
                isFullyReceived ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {record.receivedQty}
            </span>
            <TableText variant="muted" className="ml-1 text-xs">
              {record.unit}
            </TableText>
          </span>
        )
      },
    },
    {
      key: "batch",
      title: "批次",
      width: 100,
      render: (record) => <TableText variant="muted">{record.batch}</TableText>,
    },
    {
      key: "inspectionResult",
      title: "检验结果",
      width: 80,
      align: "center",
      render: (record) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            record.inspectionResult === "合格"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-600"
          )}
        >
          {record.inspectionResult}
        </span>
      ),
    },
  ]

  const colorMap: Record<string, string> = {
    green: "bg-emerald-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    gray: "bg-muted",
  }

  return (
    <ObjectPage
      mode="display"
      backPath="/goods-receipt"
      breadcrumb="收货管理"
      title={data.grNumber}
      subtitle={`参考: ${data.poRef}`}
      status={{ label: "已入库", color: "green" }}
      headerIcon={<Truck className="h-5 w-5" />}
      headerFields={[
        { label: "收货日期", value: data.receivedAt.split(" ")[0] },
        { label: "收货人", value: data.receiver },
        { label: "移动类型", value: `${data.movementType} - ${data.movementTypeName}` },
        { label: "供应商", value: data.supplier },
      ]}
      kpis={[
        { value: data.totalOrdered, label: "订单数量", color: "gray" },
        { value: data.totalReceived, label: "已收货数量", color: "green" },
        { value: `${receivedPercent}%`, label: "完成率", color: "blue" },
      ]}
      actions={[
        {
          key: "edit",
          label: "编辑",
          icon: <Pencil className="h-4 w-4" />,
          onClick: () => navigate(`/goods-receipt/${id}/edit`),
          showInModes: ["display"],
        },
      ]}
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
                  {data.plant} - {data.plantName}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">存储地点</p>
                <p className="text-sm">
                  {data.storageLocation} - {data.storageName}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">交货单号</p>
                <p className="text-sm">{data.deliveryNote}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">提单号</p>
                <p className="text-sm">{data.billOfLading}</p>
              </div>
            </div>
          ),
        },
        {
          id: "items",
          title: "收货明细",
          subtitle: `${data.items.length} 项`,
          content: (
            <EditableTable<GrItem>
              showIndex={false}
              rowKey="id"
              dataSource={data.items}
              minWidth={800}
              columns={lineColumns}
              embedded
              footer={
                <TableRow className="border-t bg-muted/50">
                  <TableCell
                    colSpan={3}
                    className="px-3 py-3 text-right text-sm font-medium"
                  >
                    合计
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right font-semibold">
                    {data.totalOrdered}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right font-semibold text-emerald-600">
                    {data.totalReceived}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              }
            />
          ),
        },
        {
          id: "history",
          title: "处理记录",
          icon: <History className="h-4 w-4" />,
          sidebar: true,
          content: (
            <div className="space-y-4">
              {data.history.map((record, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className={cn(
                      "mt-2 h-2 w-2 shrink-0 rounded-full",
                      colorMap[record.status]
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{record.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {record.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {record.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  )
}

export default ViewPage
