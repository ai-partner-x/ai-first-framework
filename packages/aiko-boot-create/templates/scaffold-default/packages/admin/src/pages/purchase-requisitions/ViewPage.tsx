import { useNavigate, useParams } from "react-router";
import { Calendar, User, Building2, Pencil, Workflow, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ObjectPage } from "@/components/admin-ui/object-page";
import {
  EditableTable,
  TableText,
  TableFooterRow,
  type EditableTableColumn,
} from "@/components/admin-ui/editable-table";
import { statusConfig, formatAmount, type WorkflowStep } from "./constants";

interface ViewItem {
  id: string;
  lineNum: number;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryDate: string;
}

const mockDetail = {
  prNumber: "PR-2024-0156",
  description: "IT设备采购申请 - 研发部笔记本电脑",
  status: "pending",
  createdAt: "2024-01-15 14:30",
  requester: "张三",
  department: "研发部",
  companyCode: "1000",
  purchaseOrg: "1000 - 总部采购组织",
  purchaseGroup: "001 - IT采购组",
  priority: "high",
  deliveryDate: "2024-02-15",
  totalQuantity: 10,
  totalAmount: 189000,
  currency: "CNY",
  items: [
    {
      id: "1",
      lineNum: 10,
      materialCode: "IT-001",
      materialName: 'MacBook Pro 14" M3',
      quantity: 10,
      unit: "台",
      unitPrice: 18900,
      amount: 189000,
      deliveryDate: "2024-02-15",
    },
  ] as ViewItem[],
  workflow: [
    { step: 1, title: "创建", user: "张三", time: "2024-01-15 14:30", status: "completed" as const },
    { step: 2, title: "部门审批", user: "李经理", time: "2024-01-15 16:00", status: "completed" as const },
    { step: 3, title: "财务审批", user: "王财务", time: "", status: "current" as const },
    { step: 4, title: "采购执行", user: "", time: "", status: "pending" as const },
  ] as WorkflowStep[],
};

const priorityLabel: Record<string, string> = {
  low: "低",
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

export function ViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const data = mockDetail;
  const status = statusConfig[data.status as keyof typeof statusConfig];

  const lineColumns: EditableTableColumn<ViewItem>[] = [
    {
      key: "lineNum",
      title: "行号",
      width: 60,
      render: (record) => <TableText variant="muted">{record.lineNum}</TableText>,
    },
    {
      key: "material",
      title: "物料",
      width: 200,
      render: (record) => (
        <div>
          <p className="text-sm font-medium">{record.materialName}</p>
          <p className="text-xs text-muted-foreground">{record.materialCode}</p>
        </div>
      ),
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
      key: "amount",
      title: "金额",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="bold">{formatAmount(record.amount)}</TableText>
      ),
    },
    {
      key: "deliveryDate",
      title: "交货日期",
      width: 100,
      render: (record) => (
        <TableText variant="muted">{record.deliveryDate}</TableText>
      ),
    },
  ];

  return (
    <ObjectPage
      mode="display"
      backPath="/purchase-requisitions"
      breadcrumb="采购申请管理"
      title={data.description || data.prNumber}
      subtitle={data.prNumber}
      status={{ label: status.label, color: status.color }}
      headerFields={[
        { icon: <Calendar className="h-4 w-4" />, label: "申请日期", value: data.createdAt.split(" ")[0] },
        { icon: <Calendar className="h-4 w-4" />, label: "交货日期", value: data.deliveryDate },
        { icon: <User className="h-4 w-4" />, label: "申请人", value: data.requester },
        { icon: <Building2 className="h-4 w-4" />, label: "公司代码", value: data.companyCode },
      ]}
      kpis={[
        { value: data.totalQuantity, label: "申请数量 (台)", color: "blue" },
        { value: formatAmount(data.items[0]?.unitPrice ?? 0), label: `单价 (${data.currency})`, color: "green" },
        { value: formatAmount(data.totalAmount), label: `总金额 (${data.currency})`, color: "orange" },
      ]}
      showSectionNav={true}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          subtitle: "采购申请的基本详情",
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">申请描述</p>
                <p className="text-sm">{data.description}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">优先级</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                    data.priority === "high" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                  )}
                >
                  {priorityLabel[data.priority] ?? data.priority}
                </span>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">部门</p>
                <p className="text-sm">{data.department}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">采购组织</p>
                <p className="text-sm">{data.purchaseOrg}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">采购组</p>
                <p className="text-sm">{data.purchaseGroup}</p>
              </div>
            </div>
          ),
        },
        {
          id: "items",
          title: "行项目",
          subtitle: "采购物料明细",
          content: (
            <EditableTable<ViewItem>
              showIndex={false}
              rowKey="id"
              dataSource={data.items}
              minWidth={700}
              header={{ title: "行项目", subtitle: "采购物料明细" }}
              columns={lineColumns}
              footer={
                <TableFooterRow
                  label="合计"
                  value={
                    <span className="font-semibold text-primary">
                      {formatAmount(data.totalAmount)}
                    </span>
                  }
                  colSpan={4}
                  valueColSpan={1}
                  tailColSpan={1}
                />
              }
            />
          ),
        },
        {
          id: "workflow",
          title: "审批流程",
          sidebar: true,
          icon: <Workflow className="h-4 w-4" />,
          content: (
            <div className="space-y-4">
              {data.workflow.map((step, index) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs text-white",
                        step.status === "completed" && "bg-emerald-500",
                        step.status === "current" && "bg-primary",
                        step.status === "pending" && "bg-muted"
                      )}
                    >
                      {step.status === "completed" ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        step.step
                      )}
                    </div>
                    {index < data.workflow.length - 1 && (
                      <div
                        className={cn(
                          "mt-1 h-8 w-0.5",
                          step.status === "completed" ? "bg-emerald-500" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium">{step.title}</p>
                    {step.user && <p className="text-xs text-muted-foreground">{step.user}</p>}
                    {step.time && (
                      <p className="mt-1 text-xs text-muted-foreground">{step.time}</p>
                    )}
                    {step.status === "current" && (
                      <span className="mt-1 inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        处理中
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: "related",
          title: "相关主数据",
          sidebar: true,
          icon: <Package className="h-4 w-4" />,
          content: (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">物料</p>
                <p className="text-sm font-medium">IT-001</p>
                <p className="text-xs text-muted-foreground">MacBook Pro 14" M3</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">供应商</p>
                <p className="text-sm font-medium">VD-001</p>
                <p className="text-xs text-muted-foreground">Apple 授权经销商</p>
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
          onClick: () => navigate(`/purchase-requisitions/${id}/edit`),
          showInModes: ["display"],
          position: "header",
        },
      ]}
    />
  );
}

export default ViewPage;
