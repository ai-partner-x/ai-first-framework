import { useNavigate, useParams } from "react-router";
import { Building2, Pencil, MapPin, User, Landmark, BarChart3, History } from "lucide-react";
import { ObjectPage } from "@/components/admin-ui/object-page";

const mockVendor = {
  id: "1",
  vendorCode: "VD-001",
  vendorName: "联想集团",
  vendorType: "supplier",
  vendorTypeName: "供货商",
  status: "active" as const,
  country: "中国",
  province: "北京市",
  city: "北京",
  district: "海淀区",
  address: "中关村软件园二期",
  postalCode: "100085",
  contactPerson: "王经理",
  phone: "010-12345678",
  mobile: "138-0000-0001",
  fax: "010-12345679",
  email: "wang@lenovo.com",
  website: "www.lenovo.com.cn",
  bankName: "中国工商银行北京分行",
  bankAccount: "6222 **** **** 1234",
  taxNumber: "91110000100001234X",
  paymentTerms: "30天净付",
  currency: "CNY",
  incoterms: "DDP",
  totalOrders: 156,
  totalAmount: 12580000,
  avgDeliveryDays: 3.5,
  qualityScore: 98.5,
  createdAt: "2023-01-15 09:00:00",
  createdBy: "系统管理员",
  updatedAt: "2024-01-10 15:30:00",
  updatedBy: "采购专员",
};

const statusConfig = {
  active: { label: "合作中", color: "green" as const },
  inactive: { label: "暂停", color: "gray" as const },
  blocked: { label: "黑名单", color: "red" as const },
};

export function ViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const data = mockVendor;
  const status = statusConfig[data.status];

  return (
    <ObjectPage
      mode="display"
      backPath="/master-data/vendors"
      breadcrumb="供应商主数据"
      title={data.vendorName}
      subtitle={`${data.vendorCode} · ${data.vendorTypeName}`}
      status={status}
      headerIcon={<Building2 className="h-5 w-5" />}
      headerFields={[
        { label: "供应商类型", value: data.vendorTypeName },
        { label: "联系人", value: data.contactPerson },
        { label: "所在城市", value: `${data.province} ${data.city}` },
        { label: "付款条件", value: data.paymentTerms },
      ]}
      kpis={[
        { value: data.totalOrders, label: "订单数量", color: "blue" },
        {
          value: `${(data.totalAmount / 10000).toFixed(0)}万`,
          label: "采购金额",
          color: "green",
        },
        { value: `${data.qualityScore}%`, label: "质量评分", color: "orange" },
      ]}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">供应商编码</p>
                <p className="text-sm font-medium">{data.vendorCode}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">供应商名称</p>
                <p className="text-sm">{data.vendorName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">供应商类型</p>
                <p className="text-sm">{data.vendorTypeName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">状态</p>
                <span
                  className={
                    data.status === "active"
                      ? "inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600"
                      : data.status === "inactive"
                      ? "inline-flex rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      : "inline-flex rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600"
                  }
                >
                  {status.label}
                </span>
              </div>
            </div>
          ),
        },
        {
          id: "address",
          title: "地址信息",
          icon: <MapPin className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">国家/地区</p>
                <p className="text-sm">{data.country}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">省/市</p>
                <p className="text-sm">
                  {data.province} · {data.city}
                </p>
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">详细地址</p>
                <p className="text-sm">
                  {data.district} {data.address}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">邮政编码</p>
                <p className="text-sm">{data.postalCode}</p>
              </div>
            </div>
          ),
        },
        {
          id: "contact",
          title: "联系信息",
          icon: <User className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">联系人</p>
                <p className="text-sm">{data.contactPerson}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">电话</p>
                <p className="text-sm">{data.phone}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">手机</p>
                <p className="text-sm">{data.mobile}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">传真</p>
                <p className="text-sm">{data.fax}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">邮箱</p>
                <p className="text-sm text-primary">{data.email}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">网站</p>
                <p className="text-sm text-primary">{data.website}</p>
              </div>
            </div>
          ),
        },
        {
          id: "bank",
          title: "银行与财务",
          icon: <Landmark className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">开户银行</p>
                <p className="text-sm">{data.bankName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">银行账号</p>
                <p className="text-sm font-mono">{data.bankAccount}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">税号</p>
                <p className="text-sm font-mono">{data.taxNumber}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">付款条件</p>
                <p className="text-sm">{data.paymentTerms}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">货币</p>
                <p className="text-sm">{data.currency}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">贸易条款</p>
                <p className="text-sm">{data.incoterms}</p>
              </div>
            </div>
          ),
        },
        {
          id: "stats",
          title: "业务统计",
          icon: <BarChart3 className="h-4 w-4" />,
          sidebar: true,
          content: (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">订单数量</span>
                <span className="text-sm font-semibold">
                  {data.totalOrders} 单
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">采购金额</span>
                <span className="text-sm font-semibold text-primary">
                  ¥{(data.totalAmount / 10000).toFixed(0)}万
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">平均交货</span>
                <span className="text-sm font-semibold">
                  {data.avgDeliveryDays} 天
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">质量评分</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {data.qualityScore}%
                </span>
              </div>
            </div>
          ),
        },
        {
          id: "history",
          title: "变更记录",
          icon: <History className="h-4 w-4" />,
          sidebar: true,
          content: (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">创建时间</p>
                <p className="text-sm">{data.createdAt}</p>
                <p className="text-xs text-muted-foreground">由 {data.createdBy}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">最后更新</p>
                <p className="text-sm">{data.updatedAt}</p>
                <p className="text-xs text-muted-foreground">由 {data.updatedBy}</p>
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
          variant: "primary",
          onClick: () => navigate(`/master-data/vendors/${id}/edit`),
        },
      ]}
    />
  );
}

export default ViewPage;
