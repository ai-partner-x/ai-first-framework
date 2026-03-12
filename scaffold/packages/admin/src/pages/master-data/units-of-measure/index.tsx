import { useState } from "react";
import { Ruler } from "lucide-react";
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

interface UnitOfMeasure extends MasterDetailItem {
  uomCode: string;
  uomName: string;
  dimension: string;
  baseUnit: string;
  conversionFactor: number;
  isoCode: string;
  createdAt: string;
  updatedAt: string;
}

const dimensionOptions = [
  { value: "数量", label: "数量" },
  { value: "重量", label: "重量" },
  { value: "长度", label: "长度" },
  { value: "体积", label: "体积" },
  { value: "面积", label: "面积" },
  { value: "时间", label: "时间" },
];

const initialUnits: UnitOfMeasure[] = [
  { id: "1", title: "EA - 个/件", subtitle: "数量", uomCode: "EA", uomName: "个/件", dimension: "数量", baseUnit: "EA", conversionFactor: 1, isoCode: "EA", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "2", title: "PC - 台", subtitle: "数量", uomCode: "PC", uomName: "台", dimension: "数量", baseUnit: "EA", conversionFactor: 1, isoCode: "H87", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "3", title: "BOX - 箱", subtitle: "数量", uomCode: "BOX", uomName: "箱", dimension: "数量", baseUnit: "EA", conversionFactor: 12, isoCode: "BX", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "4", title: "KG - 千克", subtitle: "重量", uomCode: "KG", uomName: "千克", dimension: "重量", baseUnit: "KG", conversionFactor: 1, isoCode: "KGM", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "5", title: "G - 克", subtitle: "重量", uomCode: "G", uomName: "克", dimension: "重量", baseUnit: "KG", conversionFactor: 0.001, isoCode: "GRM", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "6", title: "T - 吨", subtitle: "重量", uomCode: "T", uomName: "吨", dimension: "重量", baseUnit: "KG", conversionFactor: 1000, isoCode: "TNE", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "7", title: "M - 米", subtitle: "长度", uomCode: "M", uomName: "米", dimension: "长度", baseUnit: "M", conversionFactor: 1, isoCode: "MTR", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "8", title: "L - 升", subtitle: "体积", uomCode: "L", uomName: "升", dimension: "体积", baseUnit: "L", conversionFactor: 1, isoCode: "LTR", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
];

export function UnitsOfMeasurePage() {
  const [units, setUnits] = useState(initialUnits);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(units[0]?.id);
  const [formData, setFormData] = useState({
    uomCode: "",
    uomName: "",
    dimension: "数量",
    baseUnit: "",
    conversionFactor: 1,
    isoCode: "",
    status: "active",
  });

  const filtered = units.filter((u) => {
    if (!searchKeyword) return true;
    const k = searchKeyword.toLowerCase();
    return u.uomCode.toLowerCase().includes(k) || u.uomName.toLowerCase().includes(k) || u.dimension.toLowerCase().includes(k);
  });

  const initForm = (item: UnitOfMeasure | null) => {
    if (item) {
      setFormData({
        uomCode: item.uomCode,
        uomName: item.uomName,
        dimension: item.dimension,
        baseUnit: item.baseUnit,
        conversionFactor: item.conversionFactor,
        isoCode: item.isoCode,
        status: item.status?.color === "green" ? "active" : "inactive",
      });
    } else {
      setFormData({
        uomCode: "",
        uomName: "",
        dimension: "数量",
        baseUnit: "",
        conversionFactor: 1,
        isoCode: "",
        status: "active",
      });
    }
  };

  const handleSave = (item: UnitOfMeasure | null, mode: EditMode) => {
    const now = new Date().toISOString().split("T")[0];
    if (mode === "create") {
      const newItem: UnitOfMeasure = {
        id: Date.now().toString(),
        title: `${formData.uomCode} - ${formData.uomName}`,
        subtitle: formData.dimension,
        uomCode: formData.uomCode,
        uomName: formData.uomName,
        dimension: formData.dimension,
        baseUnit: formData.baseUnit || formData.uomCode,
        conversionFactor: formData.conversionFactor,
        isoCode: formData.isoCode,
        status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
        createdAt: now,
        updatedAt: now,
      };
      setUnits((prev) => [...prev, newItem]);
      setSelectedId(newItem.id);
    } else if (item) {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? {
                ...u,
                title: `${formData.uomCode} - ${formData.uomName}`,
                subtitle: formData.dimension,
                uomCode: formData.uomCode,
                uomName: formData.uomName,
                dimension: formData.dimension,
                baseUnit: formData.baseUnit || formData.uomCode,
                conversionFactor: formData.conversionFactor,
                isoCode: formData.isoCode,
                status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
                updatedAt: now,
              }
            : u
        )
      );
    }
  };

  const handleDelete = (item: UnitOfMeasure) => {
    setUnits((prev) => prev.filter((u) => u.id !== item.id));
    if (selectedId === item.id) setSelectedId(units.find((u) => u.id !== item.id)?.id);
  };

  const renderForm = (item: UnitOfMeasure | null, mode: EditMode) => {
    if (mode === "edit" && item && formData.uomCode !== item.uomCode) initForm(item);
    else if (mode === "create" && formData.uomCode !== "") initForm(null);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
              {formData.uomCode || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{formData.uomName || "新单位"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{formData.uomCode || "-"} · {formData.dimension}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">基本信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">单位代码 *</Label>
              <Input value={formData.uomCode} onChange={(e) => setFormData({ ...formData, uomCode: e.target.value.toUpperCase() })} placeholder="如: KG" maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">单位名称 *</Label>
              <Input value={formData.uomName} onChange={(e) => setFormData({ ...formData, uomName: e.target.value })} placeholder="如: 千克" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">计量维度</Label>
              <Select value={formData.dimension} onValueChange={(v) => setFormData({ ...formData, dimension: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dimensionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">基本单位</Label>
              <Input value={formData.baseUnit} onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value.toUpperCase() })} placeholder="如: KG" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ISO 代码</Label>
              <Input value={formData.isoCode} onChange={(e) => setFormData({ ...formData, isoCode: e.target.value })} placeholder="如: KGM" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">状态</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <h3 className="font-semibold">换算信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">换算系数</Label>
              <Input type="number" step={0.001} value={formData.conversionFactor} onChange={(e) => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">换算公式</Label>
              <div className="flex h-10 items-center rounded-lg border bg-muted/30 px-3 text-sm text-muted-foreground">
                1 {formData.uomCode || "?"} = {formData.conversionFactor} {formData.baseUnit || formData.uomCode || "?"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetail = (uom: UnitOfMeasure) => (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
            {uom.uomCode}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">{uom.uomName}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{uom.uomCode} · {uom.dimension}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{uom.conversionFactor}</div>
            <div className="text-xs text-muted-foreground">换算系数 (对{uom.baseUnit})</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">基本信息</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">单位代码</p><p className="text-sm font-mono font-semibold text-emerald-600">{uom.uomCode}</p></div>
          <div><p className="text-xs text-muted-foreground">单位名称</p><p className="text-sm">{uom.uomName}</p></div>
          <div><p className="text-xs text-muted-foreground">计量维度</p><p className="text-sm">{uom.dimension}</p></div>
          <div><p className="text-xs text-muted-foreground">基本单位</p><p className="text-sm">{uom.baseUnit}</p></div>
          <div><p className="text-xs text-muted-foreground">ISO 代码</p><p className="text-sm">{uom.isoCode}</p></div>
          <div><p className="text-xs text-muted-foreground">状态</p>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", uom.status?.color === "green" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", uom.status?.color === "green" ? "bg-emerald-500" : "bg-muted-foreground")} />
              {uom.status?.label}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">换算信息</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">换算系数</p><p className="text-sm">{uom.conversionFactor}</p></div>
          <div><p className="text-xs text-muted-foreground">换算公式</p><p className="text-sm">1 {uom.uomCode} = {uom.conversionFactor} {uom.baseUnit}</p></div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">系统信息</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">创建时间</p><p className="text-sm">{uom.createdAt}</p></div>
          <div><p className="text-xs text-muted-foreground">最后更新</p><p className="text-sm">{uom.updatedAt}</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <MasterDetail<UnitOfMeasure>
      title="计量单位"
      subtitle="管理系统中使用的计量单位和换算关系"
      headerIcon={<Ruler className="h-5 w-5" />}
      items={filtered}
      selectedId={selectedId}
      onSelect={(item) => setSelectedId(item.id)}
      onSearch={setSearchKeyword}
      searchPlaceholder="搜索单位代码、名称或维度..."
      createLabel="新建单位"
      renderDetail={renderDetail}
      renderForm={renderForm}
      onSave={handleSave}
      onDelete={handleDelete}
      masterWidth={300}
    />
  );
}

export default UnitsOfMeasurePage;
