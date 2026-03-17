import { useNavigate, useParams } from "react-router"
import { FileText, Pencil, Copy, Printer, Calendar, User } from "lucide-react"
import { ObjectPage } from "@/components/admin-ui/object-page"
import {
  EditableTable,
  TableText,
  TableFooterRow,
  type EditableTableColumn,
} from "@/components/admin-ui/editable-table"

const statusConfig = {
  draft: { label: "草稿", color: "gray" as const },
  confirmed: { label: "已确认", color: "blue" as const },
  sent: { label: "已发送", color: "yellow" as const },
  received: { label: "已收货", color: "green" as const },
  invoiced: { label: "已开票", color: "blue" as const },
  completed: { label: "已完成", color: "green" as const },
  cancelled: { label: "已取消", color: "red" as const },
}

interface PoItem {
  id: string
  lineNo: string
  material: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  netAmount: number
  taxAmount: number
  status: string
}

const mockDetail = {
  id: "1",
  poNumber: "PO-2024-0089",
  prRef: "PR-2024-0156",
  status: "sent",
  supplier: "Apple 授权经销商",
  supplierCode: "VD-001",
  supplierContact: "王经理",
  supplierPhone: "021-12345678",
  paymentTerms: "月结30天",
  incoterms: "DDP",
  totalAmount: 189000,
  taxAmount: 21862.83,
  netAmount: 167137.17,
  currency: "CNY",
  createdAt: "2024-01-20 10:30",
  createdBy: "张三",
  companyCode: "1000",
  companyName: "演示公司",
  purchaseOrg: "1000",
  purchaseGroup: "P01",
  buyer: "张三",
  deliveryDate: "2024-02-01",
  deliveryAddress: "上海市浦东新区张江高科技园区xx路xx号",
  items: [
    {
      id: "1",
      lineNo: "10",
      material: "M-1001",
      description: 'MacBook Pro 14" M3 Pro',
      quantity: 5,
      unit: "台",
      unitPrice: 18900,
      netAmount: 94500,
      taxAmount: 10917.7,
      status: "open",
    },
    {
      id: "2",
      lineNo: "20",
      material: "M-1002",
      description: 'MacBook Pro 14" M3 Max',
      quantity: 5,
      unit: "台",
      unitPrice: 18900,
      netAmount: 94500,
      taxAmount: 10945.13,
      status: "open",
    },
  ] as PoItem[],
}

const formatAmount = (amount: number) => `¥${amount.toLocaleString()}`

export function ViewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const data = mockDetail
  const status = statusConfig[data.status as keyof typeof statusConfig]

  const lineColumns: EditableTableColumn<PoItem>[] = [
    {
      key: "lineNo",
      title: "行号",
      width: 60,
      render: (record) => <TableText>{record.lineNo}</TableText>,
    },
    {
      key: "material",
      title: "物料",
      width: 120,
      render: (record) => (
        <span className="text-sm font-medium text-primary">{record.material}</span>
      ),
    },
    {
      key: "description",
      title: "描述",
      width: 200,
      render: (record) => <TableText>{record.description}</TableText>,
    },
    {
      key: "quantity",
      title: "数量",
      width: 100,
      align: "right",
      render: (record) => (
        <span>
          <TableText>{record.quantity}</TableText>
          <TableText variant="muted" className="ml-1 text-xs">
            {record.unit}
          </TableText>
        </span>
      ),
    },
    {
      key: "unitPrice",
      title: "单价",
      width: 100,
      align: "right",
      render: (record) => <TableText>{formatAmount(record.unitPrice)}</TableText>,
    },
    {
      key: "netAmount",
      title: "净金额",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="bold">{formatAmount(record.netAmount)}</TableText>
      ),
    },
    {
      key: "taxAmount",
      title: "税额",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="muted">{formatAmount(record.taxAmount)}</TableText>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: 80,
      align: "center",
      render: (record) => (
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {record.status === "open" ? "待收货" : "已收货"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <ObjectPage
        mode="display"
        backPath="/purchase-orders"
        breadcrumb="采购订单管理"
        title={data.poNumber}
        subtitle={data.supplier}
        status={{ label: status.label, color: status.color }}
        headerIcon={<FileText className="h-5 w-5" />}
        headerFields={[
          { icon: <Calendar className="h-4 w-4" />, label: "订单日期", value: data.createdAt.split(" ")[0] },
          { icon: <Calendar className="h-4 w-4" />, label: "交货日期", value: data.deliveryDate },
          { icon: <User className="h-4 w-4" />, label: "采购员", value: data.buyer },
          {
            label: "参考申请",
            value: (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => navigate(`/purchase-requisitions/${data.prRef.replace("PR-", "")}`)}
              >
                {data.prRef}
              </button>
            ),
          },
        ]}
        kpis={[
          { value: formatAmount(data.netAmount), label: "净金额", color: "gray" },
          { value: formatAmount(data.taxAmount), label: "税额", color: "gray" },
          { value: formatAmount(data.totalAmount), label: "总金额", color: "blue" },
        ]}
        showSectionNav={false}
        sections={[
          {
            id: "supplier",
            title: "供应商信息",
            content: (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">供应商</p>
                  <p className="text-sm">{data.supplier}</p>
                  <p className="text-xs text-muted-foreground">{data.supplierCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">联系人</p>
                  <p className="text-sm">{data.supplierContact}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">电话</p>
                  <p className="text-sm">{data.supplierPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">付款条款</p>
                  <p className="text-sm">{data.paymentTerms}</p>
                </div>
                <div className="md:col-span-4">
                  <p className="text-xs text-muted-foreground mb-1">交货地址</p>
                  <p className="text-sm">{data.deliveryAddress}</p>
                </div>
              </div>
            ),
          },
          {
            id: "org",
            title: "组织数据",
            content: (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">公司代码</p>
                  <p className="text-sm">
                    {data.companyCode} - {data.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">采购组织</p>
                  <p className="text-sm">{data.purchaseOrg}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">采购组</p>
                  <p className="text-sm">{data.purchaseGroup}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">贸易条款</p>
                  <p className="text-sm">{data.incoterms}</p>
                </div>
              </div>
            ),
          },
          {
            id: "items",
            title: "行项目",
            subtitle: `${data.items.length} 项`,
            content: (
              <EditableTable<PoItem>
                showIndex={false}
                rowKey="id"
                dataSource={data.items}
                minWidth={800}
                columns={lineColumns}
                footer={
                  <TableFooterRow
                    label="合计"
                    value={
                      <span className="font-semibold">
                        {formatAmount(data.netAmount)} / {formatAmount(data.taxAmount)}
                      </span>
                    }
                    colSpan={5}
                    valueColSpan={2}
                    tailColSpan={1}
                  />
                }
              />
            ),
          },
          {
            id: "history",
            title: "处理记录",
            content: (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">订单发送至供应商</p>
                      <span className="text-xs text-muted-foreground">2024-01-20 14:30</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      张三 通过邮件发送采购订单
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">订单确认</p>
                      <span className="text-xs text-muted-foreground">2024-01-20 11:00</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      采购经理 李四 确认采购订单
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">订单创建</p>
                      <span className="text-xs text-muted-foreground">2024-01-20 10:30</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      张三 基于采购申请 {data.prRef} 创建
                    </p>
                  </div>
                </div>
              </div>
            ),
          },
        ]}
        actions={[
          {
            key: "edit",
            label: "编辑",
            icon: <Pencil className="h-4 w-4" />,
            onClick: () => navigate(`/purchase-orders/${id}/edit`),
            showInModes: ["display"],
            position: "header",
          },
        ]}
      />
    </div>
  )
}

export default ViewPage
