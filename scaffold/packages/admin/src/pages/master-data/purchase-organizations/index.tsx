import { useState } from "react";
import { Building2 } from "lucide-react";
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

interface PurchaseOrg extends MasterDetailItem {
  orgCode: string;
  orgName: string;
  companyCode: string;
  companyName: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  manager: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

const initialOrgs: PurchaseOrg[] = [
  { id: "1", title: "1000 - 总部采购组织", subtitle: "北京", orgCode: "1000", orgName: "总部采购组织", companyCode: "1000", companyName: "XX科技集团有限公司", address: "朝阳区建国路89号", city: "北京", country: "中国", currency: "CNY", manager: "张伟", email: "procurement@company.com", phone: "010-88888888", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "2", title: "2000 - 华东采购组织", subtitle: "上海", orgCode: "2000", orgName: "华东采购组织", companyCode: "2000", companyName: "XX科技(上海)有限公司", address: "浦东新区陆家嘴环路1000号", city: "上海", country: "中国", currency: "CNY", manager: "李芳", email: "procurement-sh@company.com", phone: "021-66666666", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "3", title: "3000 - 华南采购组织", subtitle: "深圳", orgCode: "3000", orgName: "华南采购组织", companyCode: "3000", companyName: "XX科技(深圳)有限公司", address: "南山区科技园南区", city: "深圳", country: "中国", currency: "CNY", manager: "王磊", email: "procurement-sz@company.com", phone: "0755-88888888", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "4", title: "4000 - 西南采购组织", subtitle: "成都", orgCode: "4000", orgName: "西南采购组织", companyCode: "4000", companyName: "XX科技(成都)有限公司", address: "高新区天府大道北段", city: "成都", country: "中国", currency: "CNY", manager: "赵静", email: "procurement-cd@company.com", phone: "028-88888888", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
  { id: "5", title: "5000 - 海外采购组织", subtitle: "香港", orgCode: "5000", orgName: "海外采购组织", companyCode: "5000", companyName: "XX Technology (HK) Limited", address: "Central Plaza, Wan Chai", city: "香港", country: "中国香港", currency: "HKD", manager: "陈明", email: "procurement-hk@company.com", phone: "+852-23456789", status: { label: "启用", color: "green" }, createdAt: "2024-01-01", updatedAt: "2024-12-01" },
];

export function PurchaseOrganizationsPage() {
  const [orgs, setOrgs] = useState(initialOrgs);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(orgs[0]?.id);
  const [formData, setFormData] = useState({
    orgCode: "",
    orgName: "",
    companyCode: "",
    companyName: "",
    address: "",
    city: "",
    country: "中国",
    currency: "CNY",
    manager: "",
    email: "",
    phone: "",
    status: "active",
  });

  const filtered = orgs.filter((o) => {
    if (!searchKeyword) return true;
    const k = searchKeyword.toLowerCase();
    return o.orgCode.toLowerCase().includes(k) || o.orgName.toLowerCase().includes(k) || o.city.toLowerCase().includes(k);
  });

  const initForm = (item: PurchaseOrg | null) => {
    if (item) {
      setFormData({
        orgCode: item.orgCode,
        orgName: item.orgName,
        companyCode: item.companyCode,
        companyName: item.companyName,
        address: item.address,
        city: item.city,
        country: item.country,
        currency: item.currency,
        manager: item.manager,
        email: item.email,
        phone: item.phone,
        status: item.status?.color === "green" ? "active" : "inactive",
      });
    } else {
      setFormData({
        orgCode: "",
        orgName: "",
        companyCode: "",
        companyName: "",
        address: "",
        city: "",
        country: "中国",
        currency: "CNY",
        manager: "",
        email: "",
        phone: "",
        status: "active",
      });
    }
  };

  const handleSave = (item: PurchaseOrg | null, mode: EditMode) => {
    const now = new Date().toISOString().split("T")[0];
    if (mode === "create") {
      const newOrg: PurchaseOrg = {
        id: Date.now().toString(),
        title: `${formData.orgCode} - ${formData.orgName}`,
        subtitle: formData.city,
        orgCode: formData.orgCode,
        orgName: formData.orgName,
        companyCode: formData.companyCode,
        companyName: formData.companyName,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        currency: formData.currency,
        manager: formData.manager,
        email: formData.email,
        phone: formData.phone,
        status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
        createdAt: now,
        updatedAt: now,
      };
      setOrgs((prev) => [...prev, newOrg]);
      setSelectedId(newOrg.id);
    } else if (item) {
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === item.id
            ? {
                ...o,
                title: `${formData.orgCode} - ${formData.orgName}`,
                subtitle: formData.city,
                orgCode: formData.orgCode,
                orgName: formData.orgName,
                companyCode: formData.companyCode,
                companyName: formData.companyName,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                currency: formData.currency,
                manager: formData.manager,
                email: formData.email,
                phone: formData.phone,
                status: { label: formData.status === "active" ? "启用" : "停用", color: formData.status === "active" ? "green" : "gray" },
                updatedAt: now,
              }
            : o
        )
      );
    }
  };

  const handleDelete = (item: PurchaseOrg) => {
    setOrgs((prev) => prev.filter((o) => o.id !== item.id));
    if (selectedId === item.id) setSelectedId(orgs.find((o) => o.id !== item.id)?.id);
  };

  const renderForm = (item: PurchaseOrg | null, mode: EditMode) => {
    if (mode === "edit" && item && formData.orgCode !== item.orgCode) initForm(item);
    else if (mode === "create" && formData.orgCode !== "") initForm(null);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
              {formData.orgCode || "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{formData.orgName || "新组织"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{formData.orgCode || "-"} · {formData.city || "-"}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">基本信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">组织代码 *</Label>
              <Input value={formData.orgCode} onChange={(e) => setFormData({ ...formData, orgCode: e.target.value })} placeholder="如: 1000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">组织名称 *</Label>
              <Input value={formData.orgName} onChange={(e) => setFormData({ ...formData, orgName: e.target.value })} placeholder="如: 总部采购组织" />
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
            <div className="space-y-1.5">
              <Label className="text-xs">公司代码</Label>
              <Input value={formData.companyCode} onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })} placeholder="如: 1000" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">公司名称</Label>
              <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} placeholder="公司全称" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">地址信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="col-span-3 space-y-1.5">
              <Label className="text-xs">地址</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="详细地址" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">城市</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="如: 北京" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">国家/地区</Label>
              <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="如: 中国" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">本位币</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">CNY - 人民币</SelectItem>
                  <SelectItem value="USD">USD - 美元</SelectItem>
                  <SelectItem value="HKD">HKD - 港币</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <h3 className="font-semibold">联系信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">负责人</Label>
              <Input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} placeholder="姓名" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">电子邮件</Label>
              <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">电话</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="联系电话" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetail = (org: PurchaseOrg) => (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white">
            {org.orgCode}
          </div>
          <div>
            <h2 className="text-lg font-bold">{org.orgName}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{org.companyName}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">基本信息</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">组织代码</p><p className="text-sm font-mono font-semibold text-violet-600">{org.orgCode}</p></div>
          <div><p className="text-xs text-muted-foreground">组织名称</p><p className="text-sm">{org.orgName}</p></div>
          <div><p className="text-xs text-muted-foreground">公司代码</p><p className="text-sm">{org.companyCode}</p></div>
          <div><p className="text-xs text-muted-foreground">公司名称</p><p className="text-sm">{org.companyName}</p></div>
          <div><p className="text-xs text-muted-foreground">本位币</p><p className="text-sm">{org.currency}</p></div>
          <div><p className="text-xs text-muted-foreground">状态</p>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", org.status?.color === "green" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", org.status?.color === "green" ? "bg-emerald-500" : "bg-muted-foreground")} />
              {org.status?.label}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">地址信息</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
          <div className="col-span-3"><p className="text-xs text-muted-foreground">地址</p><p className="text-sm">{org.address}</p></div>
          <div><p className="text-xs text-muted-foreground">城市</p><p className="text-sm">{org.city}</p></div>
          <div><p className="text-xs text-muted-foreground">国家/地区</p><p className="text-sm">{org.country}</p></div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">联系信息</h3>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">负责人</p><p className="text-sm">{org.manager}</p></div>
          <div><p className="text-xs text-muted-foreground">电子邮件</p><p className="text-sm">{org.email}</p></div>
          <div><p className="text-xs text-muted-foreground">电话</p><p className="text-sm">{org.phone}</p></div>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h3 className="font-semibold">系统信息</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
          <div><p className="text-xs text-muted-foreground">创建时间</p><p className="text-sm">{org.createdAt}</p></div>
          <div><p className="text-xs text-muted-foreground">最后更新</p><p className="text-sm">{org.updatedAt}</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <MasterDetail<PurchaseOrg>
      title="采购组织"
      subtitle="管理系统中的采购组织架构"
      headerIcon={<Building2 className="h-5 w-5" />}
      items={filtered}
      selectedId={selectedId}
      onSelect={(item) => setSelectedId(item.id)}
      onSearch={setSearchKeyword}
      searchPlaceholder="搜索组织代码、名称或城市..."
      createLabel="新建组织"
      renderDetail={renderDetail}
      renderForm={renderForm}
      onSave={handleSave}
      onDelete={handleDelete}
      masterWidth={340}
    />
  );
}

export default PurchaseOrganizationsPage;
