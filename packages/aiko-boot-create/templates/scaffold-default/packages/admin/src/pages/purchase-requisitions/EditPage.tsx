import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Calendar, User, Building2, Save, Workflow, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ObjectPage } from "@/components/admin-ui/object-page";
import {
  EditableTable,
  TableInput,
  TableSelect,
  TableText,
  TableDeleteButton,
  TableFooterRow,
  type EditableTableColumn,
} from "@/components/admin-ui/editable-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  materialOptions,
  priorityOptions,
  purchaseOrgOptions,
  statusConfig,
  formatAmount,
  type LineItem,
  type WorkflowStep,
} from "./constants";

const mockDetail = {
  prNumber: "PR-2024-0156",
  description: "IT设备采购申请 - 研发部笔记本电脑",
  status: "pending",
  createdAt: "2024-01-15 14:30",
  requester: "张三",
  department: "研发部",
  companyCode: "1000",
  purchaseOrg: "1000",
  purchaseGroup: "001",
  priority: "high",
  deliveryDate: "2024-02-15",
  workflow: [
    { step: 1, title: "创建", user: "张三", time: "2024-01-15 14:30", status: "completed" as const },
    { step: 2, title: "部门审批", user: "李经理", time: "2024-01-15 16:00", status: "completed" as const },
    { step: 3, title: "财务审批", user: "王财务", time: "", status: "current" as const },
    { step: 4, title: "采购执行", user: "", time: "", status: "pending" as const },
  ] as WorkflowStep[],
};

export function EditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [headerData, setHeaderData] = useState({
    description: mockDetail.description,
    priority: mockDetail.priority,
    purchaseOrg: mockDetail.purchaseOrg,
    purchaseGroup: mockDetail.purchaseGroup,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
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
  ]);

  const status = statusConfig[mockDetail.status as keyof typeof statusConfig];

  const updateHeader = (field: string, value: string) => {
    setHeaderData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const addLineItem = () => {
    const maxLineNum = Math.max(...lineItems.map((i) => i.lineNum ?? 0), 0);
    setLineItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        lineNum: maxLineNum + 10,
        materialCode: "",
        materialName: "",
        quantity: 1,
        unit: "",
        unitPrice: 0,
        amount: 0,
        deliveryDate: "",
      },
    ]);
    setIsDirty(true);
  };

  const removeLineItem = (lineId: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== lineId));
      setIsDirty(true);
    }
  };

  const updateLineItem = (lineId: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        const updated = { ...item, [field]: value };
        if (field === "materialCode") {
          const material = materialOptions.find((m) => m.code === value);
          if (material) {
            updated.materialName = material.name;
            updated.unit = material.unit;
            updated.unitPrice = material.price;
            updated.amount = updated.quantity * material.price;
          }
        }
        if (field === "quantity" || field === "unitPrice") {
          updated.amount = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
    setIsDirty(true);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setIsDirty(false);
    navigate(`/purchase-requisitions/${id}`);
  };

  const handleCancel = () => navigate(`/purchase-requisitions/${id}`);

  const lineColumns: EditableTableColumn<LineItem>[] = [
    {
      key: "lineNum",
      title: "行号",
      width: 60,
      render: (record) => (
        <TableText variant="muted">{record.lineNum ?? "-"}</TableText>
      ),
    },
    {
      key: "materialCode",
      title: (
        <>
          物料 <span className="text-destructive">*</span>
        </>
      ),
      width: 140,
      required: true,
      render: (record) => (
        <TableSelect
          value={record.materialCode}
          onChange={(v) => updateLineItem(record.id, "materialCode", v)}
          options={materialOptions.map((m) => ({ value: m.code, label: m.code }))}
          placeholder="选择物料"
        />
      ),
    },
    {
      key: "materialName",
      title: "物料描述",
      width: 180,
      render: (record) => <TableInput value={record.materialName} readOnly />,
    },
    {
      key: "quantity",
      title: (
        <>
          数量 <span className="text-destructive">*</span>
        </>
      ),
      width: 90,
      align: "right",
      required: true,
      render: (record) => (
        <TableInput
          type="number"
          value={record.quantity}
          onChange={(v) => updateLineItem(record.id, "quantity", Number(v))}
          align="right"
        />
      ),
    },
    {
      key: "unit",
      title: "单位",
      width: 60,
      align: "center",
      render: (record) => (
        <TableText variant="muted">{record.unit || "-"}</TableText>
      ),
    },
    {
      key: "unitPrice",
      title: "单价",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="muted">
          {record.unitPrice > 0 ? formatAmount(record.unitPrice) : "-"}
        </TableText>
      ),
    },
    {
      key: "amount",
      title: "金额",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="bold">
          {record.amount > 0 ? formatAmount(record.amount) : "-"}
        </TableText>
      ),
    },
    {
      key: "deliveryDate",
      title: "交货日期",
      width: 130,
      render: (record) => (
        <TableInput
          type="date"
          value={record.deliveryDate}
          onChange={(v) => updateLineItem(record.id, "deliveryDate", v)}
        />
      ),
    },
    {
      key: "actions",
      title: "",
      width: 48,
      render: (record) => (
        <TableDeleteButton
          onClick={() => removeLineItem(record.id)}
          disabled={lineItems.length === 1}
        />
      ),
    },
  ];

  return (
    <ObjectPage
      mode="edit"
      backPath="/purchase-requisitions"
      breadcrumb="采购申请管理"
      title="编辑采购申请"
      subtitle={mockDetail.prNumber}
      status={{ label: status.label, color: status.color }}
      headerFields={[
        { icon: <Calendar className="h-4 w-4" />, label: "申请日期", value: mockDetail.createdAt.split(" ")[0] },
        { icon: <Calendar className="h-4 w-4" />, label: "交货日期", value: mockDetail.deliveryDate },
        { icon: <User className="h-4 w-4" />, label: "申请人", value: mockDetail.requester },
        { icon: <Building2 className="h-4 w-4" />, label: "公司代码", value: mockDetail.companyCode },
      ]}
      kpis={[
        { value: totalQuantity, label: "申请数量", color: "blue" },
        { value: lineItems.length, label: "行项目数", color: "green" },
        { value: formatAmount(totalAmount), label: "总金额 (CNY)", color: "orange" },
      ]}
      showSectionNav={false}
      footerLeft={isDirty ? <span className="text-amber-600">* 有未保存的更改</span> : undefined}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          subtitle: "修改采购申请的基本详情",
          content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="mb-1.5 block">
                  申请描述 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={headerData.description}
                  onChange={(e) => updateHeader("description", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">优先级</Label>
                <Select
                  value={headerData.priority}
                  onValueChange={(v) => updateHeader("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">采购组织</Label>
                <Select
                  value={headerData.purchaseOrg}
                  onValueChange={(v) => updateHeader("purchaseOrg", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrgOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ),
        },
        {
          id: "items",
          title: "行项目",
          subtitle: "修改采购物料明细",
          content: (
            <EditableTable<LineItem>
              showIndex={false}
              rowKey="id"
              dataSource={lineItems}
              minWidth={900}
              header={{
                title: "行项目",
                subtitle: "修改采购物料明细",
                actions: (
                  <Button size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    添加行
                  </Button>
                ),
              }}
              columns={lineColumns}
              footer={
                <TableFooterRow
                  label="合计金额"
                  value={
                    <span className="text-base font-semibold text-primary">
                      {formatAmount(totalAmount)}
                    </span>
                  }
                  colSpan={6}
                  valueColSpan={1}
                  tailColSpan={2}
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
              {mockDetail.workflow.map((step, index) => (
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
                    {index < mockDetail.workflow.length - 1 && (
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
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {step.time}
                      </p>
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
          key: "cancel",
          label: "取消",
          variant: "secondary",
          onClick: handleCancel,
          showInModes: ["edit"],
          position: "footer",
        },
        {
          key: "save",
          label: saving ? "保存中..." : "保存",
          variant: "primary",
          icon: <Save className="h-4 w-4" />,
          onClick: handleSave,
          loading: saving,
          disabled: saving || !isDirty,
          showInModes: ["edit"],
          position: "footer",
          showDropdown: true,
        },
      ]}
    />
  );
}

export default EditPage;
