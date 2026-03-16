import { useNavigate, useParams } from "react-router";
import { Package, Pencil, LayoutGrid, ShoppingCart, Warehouse, History } from "lucide-react";
import { ObjectPage } from "@/components/admin-ui/object-page";

const mockMaterial = {
  id: "1",
  materialCode: "IT-001",
  materialName: 'MacBook Pro 14" M3',
  materialType: "FERT",
  materialTypeName: "成品",
  materialGroup: "IT设备",
  baseUnit: "台",
  description:
    "Apple MacBook Pro 14英寸 M3芯片 16GB内存 512GB存储",
  status: "active" as const,
  grossWeight: 1.55,
  netWeight: 1.5,
  weightUnit: "KG",
  volume: 0.002,
  volumeUnit: "M3",
  purchaseGroup: "IT采购组",
  orderUnit: "台",
  minOrderQty: 1,
  standardPrice: 18900,
  priceUnit: "CNY",
  totalStock: 25,
  availableStock: 20,
  reservedStock: 5,
  valuationType: "移动平均价",
  createdAt: "2024-01-01 10:00:00",
  createdBy: "张三",
  updatedAt: "2024-01-15 14:30:00",
  updatedBy: "李四",
};

const statusConfig = {
  active: { label: "启用", color: "green" as const },
  inactive: { label: "停用", color: "gray" as const },
  blocked: { label: "冻结", color: "red" as const },
};

export function ViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const data = mockMaterial;
  const status = statusConfig[data.status];

  return (
    <ObjectPage
      mode="display"
      backPath="/master-data/materials"
      breadcrumb="物料主数据"
      title={data.materialName}
      subtitle={data.materialCode}
      status={status}
      headerIcon={<Package className="h-5 w-5" />}
      headerFields={[
        { label: "物料类型", value: data.materialTypeName },
        { label: "物料组", value: data.materialGroup },
        { label: "基本单位", value: data.baseUnit },
        {
          label: "标准价格",
          value: `¥${data.standardPrice.toLocaleString()}`,
        },
      ]}
      kpis={[
        { value: data.totalStock, label: "总库存", color: "blue" },
        { value: data.availableStock, label: "可用库存", color: "green" },
        { value: data.reservedStock, label: "预留库存", color: "orange" },
      ]}
      sections={[
        {
          id: "basic",
          title: "基本信息",
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">物料编码</p>
                <p className="text-sm font-medium">{data.materialCode}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">物料名称</p>
                <p className="text-sm">{data.materialName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">物料类型</p>
                <p className="text-sm">{data.materialTypeName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">物料组</p>
                <p className="text-sm">{data.materialGroup}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">基本单位</p>
                <p className="text-sm">{data.baseUnit}</p>
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
              <div className="col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">描述</p>
                <p className="text-sm">{data.description}</p>
              </div>
            </div>
          ),
        },
        {
          id: "spec",
          title: "规格信息",
          icon: <LayoutGrid className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">毛重</p>
                <p className="text-sm">
                  {data.grossWeight} {data.weightUnit}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">净重</p>
                <p className="text-sm">
                  {data.netWeight} {data.weightUnit}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">体积</p>
                <p className="text-sm">
                  {data.volume} {data.volumeUnit}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "purchase",
          title: "采购数据",
          icon: <ShoppingCart className="h-4 w-4" />,
          content: (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">采购组</p>
                <p className="text-sm">{data.purchaseGroup}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">订单单位</p>
                <p className="text-sm">{data.orderUnit}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">最小订单量</p>
                <p className="text-sm">{data.minOrderQty}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">标准价格</p>
                <p className="text-sm font-medium">
                  ¥{data.standardPrice.toLocaleString()}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "stock",
          title: "库存概览",
          icon: <Warehouse className="h-4 w-4" />,
          sidebar: true,
          content: (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总库存</span>
                <span className="text-sm font-semibold">
                  {data.totalStock} {data.baseUnit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">可用库存</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {data.availableStock} {data.baseUnit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">预留库存</span>
                <span className="text-sm font-semibold text-orange-600">
                  {data.reservedStock} {data.baseUnit}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">计价类型</span>
                  <span className="text-sm">{data.valuationType}</span>
                </div>
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
          onClick: () => navigate(`/master-data/materials/${id}/edit`),
        },
      ]}
    />
  );
}

export default ViewPage;
