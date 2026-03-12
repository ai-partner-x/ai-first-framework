import { useNavigate, useParams } from "react-router";
import { Factory, Pencil, Building, MapPin, User, Warehouse, Clock, BarChart3, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { ObjectPage } from "@/components/admin-ui/object-page";
import { DataTable } from "@/components/admin-ui/data-table";

const plantTypeConfig = {
  plant: { label: "生产工厂", color: "bg-blue-500/10 text-blue-600" },
  warehouse: { label: "仓库", color: "bg-orange-500/10 text-orange-600" },
  dc: { label: "配送中心", color: "bg-purple-500/10 text-purple-600" },
};

const statusConfig = {
  active: { label: "运营中", color: "green" as const },
  inactive: { label: "停用", color: "gray" as const },
};

const mockPlant = {
  id: "1",
  plantCode: "1000",
  plantName: "北京总部工厂",
  plantType: "plant" as const,
  plantTypeName: "生产工厂",
  status: "active" as const,
  companyCode: "CN01",
  companyName: "中国区公司",
  purchaseOrg: "1000",
  purchaseOrgName: "采购组织 1000",
  salesOrg: "1000",
  salesOrgName: "销售组织 1000",
  country: "中国",
  province: "北京市",
  city: "北京",
  district: "海淀区",
  address: "中关村软件园二期",
  postalCode: "100085",
  contactPerson: "张厂长",
  phone: "010-12345678",
  mobile: "139-0000-0001",
  fax: "010-12345679",
  email: "zhang@company.com",
  workingHours: "08:00 - 18:00",
  workingDays: "周一至周六",
  timezone: "GMT+8",
  language: "中文",
  storageLocations: [
    { code: "SL01", name: "原材料仓", type: "原材料", capacity: "2000 m³", utilization: 75 },
    { code: "SL02", name: "成品仓", type: "成品", capacity: "3000 m³", utilization: 60 },
    { code: "SL03", name: "半成品仓", type: "半成品", capacity: "1500 m³", utilization: 45 },
    { code: "SL04", name: "备件仓", type: "备件", capacity: "500 m³", utilization: 30 },
    { code: "SL05", name: "危险品仓", type: "特殊", capacity: "200 m³", utilization: 20 },
  ],
  totalMaterials: 1256,
  pendingOrders: 45,
  avgTurnover: 12.5,
  totalCapacity: "7200 m³",
  createdAt: "2020-01-01 09:00:00",
  createdBy: "系统管理员",
  updatedAt: "2024-01-15 14:30:00",
  updatedBy: "运营专员",
};

export function ViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const data = mockPlant;
  const status = statusConfig[data.status];
  const typeConfig = plantTypeConfig[data.plantType];

  return (
    <ObjectPage
      mode="display"
      backPath="/master-data/plants"
      breadcrumb="工厂与仓库"
      title={data.plantName}
      subtitle={data.plantCode}
      status={status}
      headerIcon={<Factory className="h-5 w-5" />}
      headerFields={[
        {
          label: "类型",
          value: (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                typeConfig.color
              )}
            >
              {typeConfig.label}
            </span>
          ),
        },
        { label: "公司代码", value: data.companyCode },
        { label: "负责人", value: data.contactPerson },
        { label: "城市", value: data.city },
      ]}
      kpis={[
        {
          value: data.totalMaterials.toLocaleString(),
          label: "物料种类",
          color: "blue",
        },
        {
          value: data.storageLocations.length,
          label: "存储位置",
          color: "green",
        },
        { value: data.pendingOrders, label: "待处理订单", color: "orange" },
      ]}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">工厂/仓库编码</p>
                <p className="text-sm font-medium">{data.plantCode}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">名称</p>
                <p className="text-sm">{data.plantName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">类型</p>
                <span
                  className={cn(
                    "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                    typeConfig.color
                  )}
                >
                  {typeConfig.label}
                </span>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">状态</p>
                <span
                  className={
                    data.status === "active"
                      ? "inline-flex rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600"
                      : "inline-flex rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  }
                >
                  {status.label}
                </span>
              </div>
            </div>
          ),
        },
        {
          id: "org",
          title: "组织结构",
          icon: <Building className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">公司代码</p>
                <p className="text-sm">
                  {data.companyCode} - {data.companyName}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">采购组织</p>
                <p className="text-sm">
                  {data.purchaseOrg} - {data.purchaseOrgName}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">销售组织</p>
                <p className="text-sm">
                  {data.salesOrg} - {data.salesOrgName}
                </p>
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
                <p className="mb-1 text-xs text-muted-foreground">负责人</p>
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
            </div>
          ),
        },
        {
          id: "storage",
          title: "存储位置",
          subtitle: `共 ${data.storageLocations.length} 个`,
          icon: <Warehouse className="h-4 w-4" />,
          content: (
            <DataTable<typeof data.storageLocations[0]>
              data={data.storageLocations}
              columns={[
                {
                  id: "code",
                  header: "编码",
                  accessorKey: "code",
                  sortable: true,
                  cell: (loc) => (
                    <span className="text-sm font-medium text-primary">
                      {loc.code}
                    </span>
                  ),
                },
                { id: "name", header: "名称", accessorKey: "name", sortable: false, cell: (loc) => <span className="text-sm">{loc.name}</span> },
                { id: "type", header: "类型", accessorKey: "type", sortable: false, cell: (loc) => <span className="text-sm text-muted-foreground">{loc.type}</span> },
                { id: "capacity", header: "容量", accessorKey: "capacity", sortable: false, cell: (loc) => <span className="text-sm text-muted-foreground">{loc.capacity}</span> },
                {
                  id: "utilization",
                  header: "利用率",
                  accessorKey: "utilization",
                  sortable: false,
                  align: "left",
                  cell: (loc) => (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            loc.utilization > 80 ? "bg-red-500" : loc.utilization > 60 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${loc.utilization}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{loc.utilization}%</span>
                    </div>
                  ),
                },
              ]}
              getRowId={(loc) => loc.code}
              enablePagination={false}
              enableSelection={false}
            />
          ),
        },
        {
          id: "operation",
          title: "运营信息",
          icon: <Clock className="h-4 w-4" />,
          sidebar: true,
          content: (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">工作时间</p>
                <p className="text-sm">{data.workingHours}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">工作日</p>
                <p className="text-sm">{data.workingDays}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">时区</p>
                <p className="text-sm">{data.timezone}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">语言</p>
                <p className="text-sm">{data.language}</p>
              </div>
            </div>
          ),
        },
        {
          id: "stats",
          title: "库存统计",
          icon: <BarChart3 className="h-4 w-4" />,
          sidebar: true,
          content: (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">物料种类</span>
                <span className="text-sm font-semibold">
                  {data.totalMaterials.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">待处理订单</span>
                <span className="text-sm font-semibold text-orange-600">
                  {data.pendingOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">平均周转天数</span>
                <span className="text-sm font-semibold">
                  {data.avgTurnover} 天
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总容量</span>
                <span className="text-sm font-semibold text-primary">
                  {data.totalCapacity}
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
          onClick: () => navigate(`/master-data/plants/${id}/edit`),
        },
      ]}
    />
  );
}

export default ViewPage;
