import { useState } from "react";
import { CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterDetail, type MasterDetailItem, type EditMode } from "@/components/admin-ui/master-detail";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CostCenter extends MasterDetailItem {
  ccCode: string;
  ccName: string;
  ccType: string;
  department: string;
  companyCode: string;
  controllingArea: string;
  profitCenter: string;
  manager: string;
  budget: number;
  used: number;
  currency: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  updatedAt: string;
}

const ccTypeOptions = [
  { value: "研发", label: "研发" },
  { value: "营销", label: "营销" },
  { value: "生产", label: "生产" },
  { value: "销售", label: "销售" },
  { value: "管理", label: "管理" },
  { value: "其他", label: "其他" },
];

const formatAmount = (amount: number) =>
  amount >= 10000 ? `¥${(amount / 10000).toFixed(0)}万` : `¥${amount.toLocaleString()}`;

const initialCostCenters: CostCenter[] = [
  { id: "1", title: "CC1001 - 研发中心", subtitle: "研发部", badge: "¥850万", ccCode: "CC1001", ccName: "研发中心", ccType: "研发", department: "研发部", companyCode: "1000", controllingArea: "1000", profitCenter: "PC1001", manager: "张三", budget: 8500000, used: 6230000, currency: "CNY", validFrom: "2024-01-01", validTo: "2024-12-31", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "2", title: "CC1002 - 市场营销", subtitle: "市场部", badge: "¥320万", ccCode: "CC1002", ccName: "市场营销", ccType: "营销", department: "市场部", companyCode: "1000", controllingArea: "1000", profitCenter: "PC1002", manager: "李四", budget: 3200000, used: 2890000, currency: "CNY", validFrom: "2024-01-01", validTo: "2024-12-31", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "3", title: "CC1003 - 行政管理", subtitle: "行政部", badge: "¥150万", ccCode: "CC1003", ccName: "行政管理", ccType: "管理", department: "行政部", companyCode: "1000", controllingArea: "1000", profitCenter: "PC1003", manager: "王五", budget: 1500000, used: 980000, currency: "CNY", validFrom: "2024-01-01", validTo: "2024-12-31", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
];

export function CostCentersPage() {
  const [costCenters, setCostCenters] = useState(initialCostCenters);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(costCenters[0]?.id);
  const [formData, setFormData] = useState({
    ccCode: "",
    ccName: "",
    ccType: "管理",
    department: "",
    companyCode: "1000",
    controllingArea: "1000",
    profitCenter: "",
    manager: "",
    budget: 0,
    currency: "CNY",
    validFrom: "",
    validTo: "",
    status: "active",
  });

  const filteredCostCenters = costCenters.filter((cc) => {
    if (!searchKeyword) return true;
    const k = searchKeyword.toLowerCase();
    return cc.ccCode.toLowerCase().includes(k) || cc.ccName.toLowerCase().includes(k) || cc.department.toLowerCase().includes(k);
  });

  const initForm = (item: CostCenter | null) => {
    if (item) {
      setFormData({
        ccCode: item.ccCode,
        ccName: item.ccName,
        ccType: item.ccType,
        department: item.department,
        companyCode: item.companyCode,
        controllingArea: item.controllingArea,
        profitCenter: item.profitCenter,
        manager: item.manager,
        budget: item.budget,
        currency: item.currency,
        validFrom: item.validFrom,
        validTo: item.validTo,
        status: item.status?.color === "green" ? "active" : "inactive",
      });
    } else {
      setFormData({
        ccCode: "",
        ccName: "",
        ccType: "管理",
        department: "",
        companyCode: "1000",
        controllingArea: "1000",
        profitCenter: "",
        manager: "",
        budget: 0,
        currency: "CNY",
        validFrom: "",
        validTo: "",
        status: "active",
      });
    }
  };

  const handleSave = (item: CostCenter | null, mode: EditMode) => {
    const now = new Date().toISOString().split("T")[0];
    if (mode === "create") {
      const newItem: CostCenter = {
        id: Date.now().toString(),
        title: `${formData.ccCode} - ${formData.ccName}`,
        subtitle: formData.department,
        badge: formatAmount(formData.budget),
        ccCode: formData.ccCode,
        ccName: formData.ccName,
        ccType: formData.ccType,
        department: formData.department,
        companyCode: formData.companyCode,
        controllingArea: formData.controllingArea,
        profitCenter: formData.profitCenter,
        manager: formData.manager,
        budget: formData.budget,
        used: 0,
        currency: formData.currency,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
        createdAt: now,
        updatedAt: now,
      };
      setCostCenters((prev) => [...prev, newItem]);
      setSelectedId(newItem.id);
    } else if (item) {
      setCostCenters((prev) =>
        prev.map((cc) =>
          cc.id === item.id
            ? {
                ...cc,
                title: `${formData.ccCode} - ${formData.ccName}`,
                subtitle: formData.department,
                badge: formatAmount(formData.budget),
                ccCode: formData.ccCode,
                ccName: formData.ccName,
                ccType: formData.ccType,
                department: formData.department,
                companyCode: formData.companyCode,
                controllingArea: formData.controllingArea,
                profitCenter: formData.profitCenter,
                manager: formData.manager,
                budget: formData.budget,
                currency: formData.currency,
                validFrom: formData.validFrom,
                validTo: formData.validTo,
                status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
                updatedAt: now,
              }
            : cc
        )
      );
    }
  };

  const handleDelete = (item: CostCenter) => {
    setCostCenters((prev) => prev.filter((cc) => cc.id !== item.id));
    if (selectedId === item.id) {
      setSelectedId(costCenters.find((cc) => cc.id !== item.id)?.id);
    }
  };

  const renderForm = (item: CostCenter | null, mode: EditMode) => {
    if (mode === "edit" && item && formData.ccCode !== item.ccCode) initForm(item);
    else if (mode === "create" && formData.ccCode !== "") initForm(null);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-base font-bold text-white">
              {formData.ccCode.slice(-4) || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{formData.ccName || "新成本中心"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formData.ccCode || "-"} · {formData.department || "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">基本信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">成本中心代码 *</Label>
              <Input
                value={formData.ccCode}
                onChange={(e) => setFormData({ ...formData, ccCode: e.target.value.toUpperCase() })}
                placeholder="如: CC1001"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">成本中心名称 *</Label>
              <Input
                value={formData.ccName}
                onChange={(e) => setFormData({ ...formData, ccName: e.target.value })}
                placeholder="如: 研发中心"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">成本中心类型</Label>
              <Select
                value={formData.ccType}
                onValueChange={(v) => setFormData({ ...formData, ccType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ccTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">所属部门</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="如: 研发部"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">负责人</Label>
              <Input
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="姓名"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">状态</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">组织信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">公司代码</Label>
              <Input
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">控制范围</Label>
              <Input
                value={formData.controllingArea}
                onChange={(e) => setFormData({ ...formData, controllingArea: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">利润中心</Label>
              <Input
                value={formData.profitCenter}
                onChange={(e) => setFormData({ ...formData, profitCenter: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">预算与有效期</h3>
          </div>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">预算金额</Label>
              <Input
                type="number"
                value={formData.budget || ""}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">币种</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => setFormData({ ...formData, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">CNY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">有效期从</Label>
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">有效期至</Label>
              <Input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetail = (cc: CostCenter, actionButtons?: React.ReactNode) => {
    const usagePercent = cc.budget > 0 ? Math.round((cc.used / cc.budget) * 100) : 0;
    const remaining = cc.budget - cc.used;

    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-base font-bold text-white">
              {cc.ccCode.slice(-4)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">{cc.ccName}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {cc.ccCode} · {cc.department}
              </p>
            </div>
            {actionButtons}
          </div>
          {cc.budget > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">预算使用情况</span>
                <span className="text-sm font-medium">{usagePercent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>已使用 {formatAmount(cc.used)}</span>
                <span>剩余 {formatAmount(remaining)}</span>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">基本信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div>
              <p className="text-xs text-muted-foreground">成本中心代码</p>
              <p className="font-mono text-sm font-semibold text-orange-600">{cc.ccCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">成本中心名称</p>
              <p className="text-sm">{cc.ccName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">状态</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  cc.status?.color === "green" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", cc.status?.color === "green" ? "bg-emerald-500" : "bg-muted-foreground")} />
                {cc.status?.label}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">预算信息</h3>
          </div>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4 p-5">
            <div>
              <p className="text-xs text-muted-foreground">预算金额</p>
              <p className="text-sm font-semibold">{formatAmount(cc.budget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">已使用</p>
              <p className="text-sm">{formatAmount(cc.used)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">剩余</p>
              <p className="text-sm">{formatAmount(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">币种</p>
              <p className="text-sm">{cc.currency}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MasterDetail<CostCenter>
      title="成本中心"
      subtitle="管理系统中的成本中心和预算分配"
      headerIcon={<CircleDollarSign className="h-5 w-5" />}
      items={filteredCostCenters}
      selectedId={selectedId}
      onSelect={(item) => setSelectedId(item.id)}
      onSearch={setSearchKeyword}
      searchPlaceholder="搜索成本中心代码、名称或部门..."
      createLabel="新建成本中心"
      renderDetail={renderDetail}
      renderForm={renderForm}
      onSave={handleSave}
      onDelete={handleDelete}
      masterWidth={320}
    />
  );
}

export default CostCentersPage;
