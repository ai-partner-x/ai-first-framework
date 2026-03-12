import { useState } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, Filter, RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react";
import { ListReport, type ListReportColumn } from "@/components/admin-ui/list-report";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const kpiData = {
  totalCount: 156,
  totalCountChange: 12.5,
  totalAmount: 2850000,
  totalAmountChange: 8.3,
  pendingCount: 23,
  pendingCountChange: -5.2,
  avgProcessDays: 3.2,
  avgProcessDaysChange: -15.0,
};

const detailList = [
  { id: "1", prNumber: "PR-2024-0156", description: "IT设备采购", requester: "张三", department: "研发部", amount: 189000, status: "pending", createdAt: "2024-01-15" },
  { id: "2", prNumber: "PR-2024-0155", description: "办公用品采购", requester: "李四", department: "行政部", amount: 15800, status: "approved", createdAt: "2024-01-14" },
  { id: "3", prNumber: "PR-2024-0154", description: "市场活动物料", requester: "王五", department: "市场部", amount: 68000, status: "approved", createdAt: "2024-01-13" },
  { id: "4", prNumber: "PR-2024-0153", description: "服务器采购", requester: "赵六", department: "研发部", amount: 258000, status: "processing", createdAt: "2024-01-12" },
  { id: "5", prNumber: "PR-2024-0152", description: "差旅费用报销", requester: "钱七", department: "市场部", amount: 12500, status: "rejected", createdAt: "2024-01-11" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-muted text-muted-foreground" },
  pending: { label: "待审批", color: "bg-amber-500/10 text-amber-700" },
  approved: { label: "已批准", color: "bg-emerald-500/10 text-emerald-700" },
  rejected: { label: "已拒绝", color: "bg-red-500/10 text-red-600" },
  processing: { label: "处理中", color: "bg-blue-500/10 text-blue-600" },
};

type DetailRow = (typeof detailList)[number];

export function PurchaseRequisitionReport() {
  const [timeRange, setTimeRange] = useState("month");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    requester: "",
    amountRange: "",
  });

  const formatAmount = (amount: number) =>
    amount >= 10000 ? `¥${(amount / 10000).toFixed(1)}万` : `¥${amount.toLocaleString()}`;

  const filterCount = Object.values(filters).filter((v) => v !== "").length;
  const handleClearFilters = () =>
    setFilters({ status: "", department: "", requester: "", amountRange: "" });

  const columns: ListReportColumn<DetailRow>[] = [
    {
      id: "prNumber",
      header: "申请编号",
      sortable: true,
      accessorKey: "prNumber",
      cell: (row) => (
        <span className="text-sm font-medium text-primary">{row.prNumber}</span>
      ),
    },
    {
      id: "description",
      header: "描述",
      cell: (row) => (
        <span className="text-sm">{row.description}</span>
      ),
    },
    {
      id: "requester",
      header: "申请人",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.requester}</span>
      ),
    },
    {
      id: "department",
      header: "部门",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.department}</span>
      ),
    },
    {
      id: "amount",
      header: "金额",
      align: "right",
      cell: (row) => (
        <span className="text-sm font-medium">¥{row.amount.toLocaleString()}</span>
      ),
    },
    {
      id: "status",
      header: "状态",
      align: "center",
      cell: (row) => {
        const status = statusConfig[row.status] ?? { label: row.status, color: "bg-muted text-muted-foreground" };
        return (
          <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", status.color)}>
            {status.label}
          </span>
        );
      },
    },
    {
      id: "createdAt",
      header: "申请日期",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.createdAt}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute right-8 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold">采购申请分析报表</h1>
              <p className="text-sm text-white/70">Analytical List Page - 多维度采购申请数据分析</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="quarter">本季度</SelectItem>
                <SelectItem value="year">本年度</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showFilter ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              导出
            </Button>
          </div>
        </div>

        {showFilter && (
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">状态</Label>
                <Select
                  value={filters.status || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, status: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="pending">待审批</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">部门</Label>
                <Select
                  value={filters.department || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, department: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="dev">研发部</SelectItem>
                    <SelectItem value="market">市场部</SelectItem>
                    <SelectItem value="ops">运营部</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">申请人</Label>
                <Input
                  placeholder="输入申请人姓名"
                  value={filters.requester}
                  onChange={(e) => setFilters({ ...filters, requester: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">金额范围</Label>
                <Select
                  value={filters.amountRange || "__all__"}
                  onValueChange={(v) => setFilters({ ...filters, amountRange: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">全部</SelectItem>
                    <SelectItem value="0-10000">1万以下</SelectItem>
                    <SelectItem value="10000-50000">1-5万</SelectItem>
                    <SelectItem value="50000-100000">5-10万</SelectItem>
                    <SelectItem value="100000+">10万以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">申请总数</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold">{kpiData.totalCount}</p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.totalCountChange >= 0 ? "text-emerald-600" : "text-red-600")}>
              {kpiData.totalCountChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.totalCountChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">申请总金额</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-blue-600">{formatAmount(kpiData.totalAmount)}</p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.totalAmountChange >= 0 ? "text-emerald-600" : "text-red-600")}>
              {kpiData.totalAmountChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.totalAmountChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">待审批数量</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-amber-600">{kpiData.pendingCount}</p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.pendingCountChange >= 0 ? "text-red-600" : "text-emerald-600")}>
              {kpiData.pendingCountChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.pendingCountChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm text-muted-foreground">平均处理天数</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold">
              {kpiData.avgProcessDays}
              <span className="text-lg font-normal text-muted-foreground">天</span>
            </p>
            <div className={cn("flex items-center gap-1 text-sm font-medium", kpiData.avgProcessDaysChange >= 0 ? "text-red-600" : "text-emerald-600")}>
              {kpiData.avgProcessDaysChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(kpiData.avgProcessDaysChange)}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">较上期</p>
        </Card>
      </div>

      {/* 明细列表 */}
      <ListReport<DetailRow>
        header={{
          title: "采购申请明细",
          subtitle: "共 " + detailList.length + " 条",
          icon: <BarChart3 className="h-5 w-5" />,
        }}
        data={detailList}
        columns={columns}
        totalCount={detailList.length}
        getRowId={(row) => row.id}
      />
    </div>
  );
}

export default PurchaseRequisitionReport;
