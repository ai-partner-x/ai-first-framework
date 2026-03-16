import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, User, Building2, Plus, Send, Save } from "lucide-react";
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
  formatAmount,
  type LineItem,
} from "./constants";

const initialLineItem = (): LineItem => ({
  id: String(Date.now()),
  materialCode: "",
  materialName: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
  amount: 0,
  deliveryDate: "",
  note: "",
});

export function CreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [headerData, setHeaderData] = useState({
    requester: "当前用户",
    department: "研发部",
    companyCode: "1000",
    purchaseOrg: "1000",
    purchaseGroup: "001",
    requestDate: new Date().toISOString().split("T")[0],
    description: "",
    priority: "normal",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([initialLineItem()]);

  const addLineItem = () => {
    setLineItems((prev) => [...prev, initialLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
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
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    navigate("/purchase-requisitions");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    navigate("/purchase-requisitions");
  };

  const handleCancel = () => navigate("/purchase-requisitions");

  const lineColumns: EditableTableColumn<LineItem>[] = [
    {
      key: "index",
      title: "#",
      width: 40,
      render: (_, index) => <TableText variant="muted">{index + 1}</TableText>,
    },
    {
      key: "materialCode",
      title: (
        <>
          物料 <span className="text-destructive">*</span>
        </>
      ),
      width: 160,
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
      render: (record) => (
        <TableInput value={record.materialName} readOnly placeholder="-" />
      ),
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
      width: 56,
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
      mode="create"
      backPath="/purchase-requisitions"
      breadcrumb="采购申请管理"
      title="创建采购申请"
      subtitle="新建采购申请项目"
      headerFields={[
        { icon: <Calendar className="h-4 w-4" />, label: "申请日期", value: headerData.requestDate },
        { icon: <User className="h-4 w-4" />, label: "申请人", value: headerData.requester },
        { icon: <Building2 className="h-4 w-4" />, label: "公司代码", value: headerData.companyCode },
        {
          icon: <Building2 className="h-4 w-4" />,
          label: "采购组织",
          value: `${headerData.purchaseOrg} - 总部采购组织`,
        },
      ]}
      tips={[
        "📝 填写必填字段以创建申请",
        "💡 使用值帮助选择物料",
        "📋 至少添加一个行项目",
        "⚡ 快捷键：Ctrl+S 保存",
      ]}
      showSectionNav={false}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          subtitle: "填写采购申请的基本详情",
          content: (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Label className="mb-1.5 block">
                  申请描述 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={headerData.description}
                  onChange={(e) =>
                    setHeaderData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="请输入采购申请描述"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">优先级</Label>
                <Select
                  value={headerData.priority}
                  onValueChange={(v) =>
                    setHeaderData((prev) => ({ ...prev, priority: v }))
                  }
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
                <Label className="mb-1.5 block">申请人</Label>
                <Input
                  value={headerData.requester}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">部门</Label>
                <Input
                  value={headerData.department}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">采购组织</Label>
                <Select
                  value={headerData.purchaseOrg}
                  onValueChange={(v) =>
                    setHeaderData((prev) => ({ ...prev, purchaseOrg: v }))
                  }
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
          subtitle: "添加需要采购的物料明细",
          content: (
            <EditableTable<LineItem>
              showIndex={false}
              rowKey="id"
              dataSource={lineItems}
              minWidth={900}
              header={{
                title: "行项目",
                subtitle: "添加需要采购的物料明细",
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
      ]}
      actions={[
        {
          key: "cancel",
          label: "取消",
          variant: "secondary",
          icon: null,
          onClick: handleCancel,
          showInModes: ["create"],
          position: "footer",
        },
        {
          key: "submit",
          label: submitting ? "提交中..." : "提交审批",
          variant: "success",
          icon: <Send className="h-4 w-4" />,
          onClick: handleSubmit,
          loading: submitting,
          disabled: saving || submitting,
          showInModes: ["create"],
          position: "footer",
        },
        {
          key: "save",
          label: saving ? "保存中..." : "保存",
          variant: "primary",
          icon: <Save className="h-4 w-4" />,
          onClick: handleSave,
          loading: saving,
          disabled: saving || submitting,
          showInModes: ["create"],
          position: "footer",
          showDropdown: true,
        },
      ]}
    />
  );
}

export default CreatePage;
