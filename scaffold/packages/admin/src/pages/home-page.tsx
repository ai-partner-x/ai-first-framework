import { useNavigate } from "react-router";
import {
  ShoppingCart,
  Package,
  Truck,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  FileText,
  Check,
} from "lucide-react";

const stats = [
  {
    title: "待处理采购申请",
    value: 12,
    trend: { value: "+3", direction: "up" as const },
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: ShoppingCart,
  },
  {
    title: "进行中订单",
    value: 8,
    trend: { value: "-2", direction: "down" as const },
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    icon: Package,
  },
  {
    title: "待收货",
    value: 5,
    trend: { value: "+1", direction: "up" as const },
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    icon: Truck,
  },
  {
    title: "本月采购额",
    value: "¥125,430",
    trend: { value: "+12%", direction: "up" as const },
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    icon: BarChart3,
  },
];

const quickActions = [
  {
    title: "创建采购申请",
    desc: "发起新的采购需求",
    icon: ShoppingCart,
    color: "text-primary",
    bg: "bg-primary/10",
    path: "/purchase-requisitions/create",
  },
  {
    title: "查看订单",
    desc: "管理采购订单",
    icon: Package,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    path: "/purchase-orders",
  },
  {
    title: "收货确认",
    desc: "确认货物接收",
    icon: Truck,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    path: "/goods-receipt",
  },
  {
    title: "查看报表",
    desc: "数据分析报表",
    icon: BarChart3,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    path: "/reports/purchase-requisitions",
  },
];

const recentActivities = [
  { type: "created" as const, title: "创建采购申请 PR-2024-0156", time: "10 分钟前", user: "张三" },
  { type: "approved" as const, title: "采购订单 PO-2024-0089 已审批", time: "30 分钟前", user: "李经理" },
  { type: "received" as const, title: "收货单 GR-2024-0234 已确认", time: "1 小时前", user: "王五" },
  { type: "created" as const, title: "创建采购申请 PR-2024-0155", time: "2 小时前", user: "赵六" },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">首页概览</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">欢迎回来！以下是您的工作概况</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-4" />
          <span>最后更新: 刚刚</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
          >
            <div
              className={`absolute right-0 top-0 size-24 -mr-6 -mt-6 rounded-full opacity-50 transition-opacity group-hover:opacity-70 ${stat.bgColor}`}
            />
            <div className="relative">
              <div
                className={`mb-4 flex size-10 items-center justify-center rounded-lg ${stat.bgColor} ${stat.color}`}
              >
                <stat.icon className="size-5" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">{stat.title}</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span
                  className={`mb-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    stat.trend.direction === "up"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {stat.trend.direction === "up" ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {stat.trend.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">快捷操作</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="group rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 text-left transition-all hover:border-muted-foreground/20 hover:shadow-sm"
                  >
                    <div
                      className={`mb-3 flex size-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${action.bg} ${action.color}`}
                    >
                      <action.icon className="size-5" />
                    </div>
                    <p className="mb-0.5 font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">最近活动</h2>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/90"
              >
                查看全部 <ArrowRight className="size-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="cursor-pointer px-5 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                        activity.type === "created"
                          ? "bg-primary/10 text-primary"
                          : activity.type === "approved"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {activity.type === "created" ? (
                        <FileText className="size-4" />
                      ) : activity.type === "approved" ? (
                        <Check className="size-4" />
                      ) : (
                        <Truck className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{activity.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activity.user} · {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
            <ShoppingCart className="size-6" />
          </div>
          <div>
            <p className="font-semibold">您有 12 个待处理的采购申请</p>
            <p className="mt-0.5 text-sm text-primary-foreground/80">建议尽快处理以避免延误</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/purchase-requisitions")}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-white/90"
        >
          立即处理
        </button>
      </div>
    </div>
  );
}
