import { useState } from "react";
import { useNavigate } from "react-router";
import { Truck, Save, Calendar, User, Building2 } from "lucide-react";
import { ObjectPage } from "@/components/admin-ui/object-page";
import {
  EditableTable,
  TableInput,
  TableText,
  type EditableTableColumn,
} from "@/components/admin-ui/editable-table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PoMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  receiveQty: number;
}

const poMaterials: Record<string, PoMaterial[]> = {
  "PO-2024-0090": [
    { id: "1", materialCode: "IT-001", materialName: 'MacBook Pro 14" M3', orderedQty: 10, receivedQty: 5, unit: "台", receiveQty: 0 },
    { id: "2", materialCode: "IT-015", materialName: 'Dell 27" 4K显示器', orderedQty: 20, receivedQty: 10, unit: "台", receiveQty: 0 },
    { id: "3", materialCode: "IT-032", materialName: "无线键鼠套装", orderedQty: 50, receivedQty: 30, unit: "套", receiveQty: 0 },
  ],
  "PO-2024-0091": [
    { id: "1", materialCode: "FN-008", materialName: "人体工学办公椅", orderedQty: 15, receivedQty: 0, unit: "把", receiveQty: 0 },
    { id: "2", materialCode: "OF-023", materialName: "A4复印纸 80g", orderedQty: 100, receivedQty: 50, unit: "包", receiveQty: 0 },
  ],
};

const poOptions = [
  { value: "PO-2024-0090", label: "PO-2024-0090 - 办公设备采购" },
  { value: "PO-2024-0091", label: "PO-2024-0091 - IT设备补充" },
];
const plantOptions = [
  { value: "1000", label: "1000 - 总部" },
  { value: "2000", label: "2000 - 华东分部" },
];
const storageOptions = [
  { value: "WH01", label: "WH01 - 主仓库" },
  { value: "WH02", label: "WH02 - 备用仓库" },
];

export function CreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    poRef: "",
    plant: "1000",
    storageLocation: "WH01",
  });
  const [materials, setMaterials] = useState<PoMaterial[]>([]);

  const handlePoChange = (poRef: string) => {
    setFormData((prev) => ({ ...prev, poRef }));
    if (poRef && poMaterials[poRef]) {
      setMaterials(
        poMaterials[poRef].map((m) => ({
          ...m,
          receiveQty: m.orderedQty - m.receivedQty,
        }))
      );
    } else {
      setMaterials([]);
    }
  };

  const updateReceiveQty = (id: string, qty: number) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const max = m.orderedQty - m.receivedQty;
        return { ...m, receiveQty: Math.max(0, Math.min(qty, max)) };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    navigate("/goods-receipt");
  };

  const today = new Date().toISOString().split("T")[0];

  const columns: EditableTableColumn<PoMaterial>[] = [
    {
      key: "materialCode",
      title: "物料编码",
      width: 120,
      render: (record) => (
        <TableText variant="mono">{record.materialCode}</TableText>
      ),
    },
    {
      key: "materialName",
      title: "物料名称",
      width: 200,
      render: (record) => <TableText>{record.materialName}</TableText>,
    },
    {
      key: "orderedQty",
      title: "订单数量",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="muted">{record.orderedQty}</TableText>
      ),
    },
    {
      key: "receivedQty",
      title: "已收货",
      width: 100,
      align: "right",
      render: (record) => (
        <TableText variant="muted">{record.receivedQty}</TableText>
      ),
    },
    {
      key: "receiveQty",
      title: "本次收货",
      width: 120,
      align: "right",
      required: true,
      render: (record) => (
        <TableInput
          type="number"
          value={record.receiveQty}
          onChange={(val) =>
            updateReceiveQty(record.id, parseInt(val, 10) || 0)
          }
          min={0}
          max={record.orderedQty - record.receivedQty}
          align="right"
        />
      ),
    },
    {
      key: "unit",
      title: "单位",
      width: 80,
      align: "center",
      render: (record) => (
        <TableText variant="muted">{record.unit}</TableText>
      ),
    },
  ];

  return (
    <ObjectPage
      mode="create"
      backPath="/goods-receipt"
      breadcrumb="收货管理"
      title="创建收货单"
      subtitle="新建收货单据"
      headerIcon={<Truck className="h-5 w-5" />}
      headerFields={[
        { icon: <Calendar className="h-4 w-4" />, label: "收货日期", value: today },
        { icon: <User className="h-4 w-4" />, label: "收货人", value: "当前用户" },
        { icon: <Building2 className="h-4 w-4" />, label: "工厂", value: "1000 - 总部" },
        { icon: <Building2 className="h-4 w-4" />, label: "存储位置", value: "WH01 - 主仓库" },
      ]}
      tips={[
        "📦 选择采购订单后自动加载物料",
        "📋 确认收货数量后保存",
        "⚡ 快捷键：Ctrl+S 保存",
      ]}
      showSectionNav={false}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">
                  采购订单 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.poRef || "__empty__"}
                  onValueChange={(v) =>
                    handlePoChange(v === "__empty__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择采购订单" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">选择采购订单</SelectItem>
                    {poOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">
                  工厂 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.plant}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, plant: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plantOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">
                  存储位置 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.storageLocation}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, storageLocation: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storageOptions.map((opt) => (
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
          title: "收货物料",
          subtitle:
            materials.length > 0
              ? `共 ${materials.length} 项`
              : "选择采购订单后自动加载",
          content: (
            <EditableTable<PoMaterial>
              showIndex
              rowKey="id"
              dataSource={materials}
              minWidth={700}
              columns={columns}
              emptyText="请先选择采购订单"
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
          onClick: () => navigate("/goods-receipt"),
          showInModes: ["create"],
          position: "footer",
        },
        {
          key: "save",
          label: saving ? "保存中..." : "保存",
          icon: <Save className="h-4 w-4" />,
          variant: "primary",
          onClick: handleSave,
          loading: saving,
          showInModes: ["create"],
          position: "footer",
          showDropdown: true,
        },
      ]}
    />
  );
}

export default CreatePage;
