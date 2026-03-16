import { useState } from "react";
import { Settings, User, Bell, Palette, Globe, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/admin-ui/theme/theme-provider";
import type { Appearance, Palette as ThemePalette } from "@/components/admin-ui/theme/theme-provider";

function SettingSection({
  icon,
  title,
  description,
  children,
  iconBg,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className={cn("flex size-9 items-center justify-center rounded-lg text-primary-foreground", iconBg)}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ThemeOption({
  value,
  label,
  active,
  icon,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-all",
        active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl",
          value === "light" && "bg-muted",
          value === "dark" && "bg-muted-foreground",
          value === "system" && "bg-gradient-to-br from-muted to-muted-foreground"
        )}
      >
        {icon}
      </div>
      <span className={cn("text-sm font-medium", active ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
      {active && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
}

export function SettingsPage() {
  const { appearance, palette, setTheme: setAppTheme } = useTheme();
  const [language, setLanguage] = useState("zh-CN");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-muted/30 shadow-sm">
      <div className="bg-primary px-6 py-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">系统设置</h1>
            <p className="mt-0.5 text-sm text-primary-foreground/80">管理您的账户和系统偏好设置</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <SettingSection
            icon={<User className="size-5" />}
            title="个人信息"
            description="管理您的账户基本信息"
            iconBg="bg-primary"
          >
            <div className="mb-5 flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                A
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold">Admin</h4>
                <p className="text-sm text-muted-foreground">系统管理员</p>
              </div>
              <Button variant="secondary" size="sm">
                编辑资料
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">用户名</Label>
                <Input value="admin" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">邮箱地址</Label>
                <Input value="admin@example.com" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">手机号码</Label>
                <Input value="+86 138****8888" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">部门</Label>
                <Input value="信息技术部" disabled className="bg-muted" />
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={<Bell className="size-5" />}
            title="通知设置"
            description="配置消息通知方式"
            iconBg="bg-amber-500"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="font-medium">邮件通知</Label>
                  <p className="text-xs text-muted-foreground">接收重要事项的邮件提醒</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(v) => setNotifications({ ...notifications, email: v })}
                />
              </div>
              <div className="flex items-center justify-between border-t border-border py-2">
                <div>
                  <Label className="font-medium">浏览器推送</Label>
                  <p className="text-xs text-muted-foreground">在浏览器中接收实时通知</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(v) => setNotifications({ ...notifications, push: v })}
                />
              </div>
              <div className="flex items-center justify-between border-t border-border py-2">
                <div>
                  <Label className="font-medium">短信通知</Label>
                  <p className="text-xs text-muted-foreground">接收紧急事项的短信提醒</p>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(v) => setNotifications({ ...notifications, sms: v })}
                />
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={<Palette className="size-5" />}
            title="外观设置"
            description="自定义界面外观主题"
            iconBg="bg-purple-500"
          >
            <div className="flex gap-3">
              <ThemeOption
                value="light"
                label="浅色模式"
                active={appearance === "light"}
                onClick={() => setAppTheme({ appearance: "light" as Appearance })}
                icon={<div className="size-6 rounded-full border-2 border-muted-foreground" />}
              />
              <ThemeOption
                value="dark"
                label="深色模式"
                active={appearance === "dark"}
                onClick={() => setAppTheme({ appearance: "dark" as Appearance })}
                icon={<div className="size-6 rounded-full bg-muted-foreground" />}
              />
              <ThemeOption
                value="system"
                label="跟随系统"
                active={appearance === "system"}
                onClick={() => setAppTheme({ appearance: "system" as Appearance })}
                icon={<div className="size-6 rounded-full bg-gradient-to-br from-muted to-muted-foreground" />}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">配色</Label>
                <Select
                  value={palette}
                  onValueChange={(v) => setAppTheme({ palette: v as ThemePalette })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">默认</SelectItem>
                    <SelectItem value="blue">蓝色</SelectItem>
                    <SelectItem value="green">绿色</SelectItem>
                    <SelectItem value="violet">紫色</SelectItem>
                    <SelectItem value="rose">玫红</SelectItem>
                    <SelectItem value="amber">琥珀</SelectItem>
                    <SelectItem value="fiori">Fiori</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={<Globe className="size-5" />}
            title="语言和地区"
            description="设置界面语言和区域格式"
            iconBg="bg-emerald-500"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">界面语言</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-CN">简体中文</SelectItem>
                    <SelectItem value="zh-TW">繁體中文</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="ja-JP">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">时区</Label>
                <Select value="Asia/Shanghai" onValueChange={() => {}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Shanghai">(UTC+8) 中国标准时间</SelectItem>
                    <SelectItem value="Asia/Tokyo">(UTC+9) 日本标准时间</SelectItem>
                    <SelectItem value="America/New_York">(UTC-5) 美国东部时间</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">日期格式</Label>
                <Select value="YYYY-MM-DD" onValueChange={() => {}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">2024-12-31</SelectItem>
                    <SelectItem value="DD/MM/YYYY">31/12/2024</SelectItem>
                    <SelectItem value="MM/DD/YYYY">12/31/2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">数字格式</Label>
                <Select value="1,234.56" onValueChange={() => {}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1,234.56">1,234.56</SelectItem>
                    <SelectItem value="1.234,56">1.234,56</SelectItem>
                    <SelectItem value="1 234.56">1 234.56</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingSection>

          <SettingSection
            icon={<Shield className="size-5" />}
            title="安全设置"
            description="管理账户安全选项"
            iconBg="bg-destructive"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium">修改密码</span>
                  <p className="text-xs text-muted-foreground">上次修改：30 天前</p>
                </div>
                <Button variant="outline" size="sm">修改密码</Button>
              </div>
              <div className="flex items-center justify-between border-t border-border py-2">
                <div>
                  <span className="text-sm font-medium">双因素认证</span>
                  <p className="text-xs text-muted-foreground">增强账户安全性</p>
                </div>
                <Button size="sm" variant="secondary" className="text-emerald-600">已启用</Button>
              </div>
              <div className="flex items-center justify-between border-t border-border py-2">
                <div>
                  <span className="text-sm font-medium">登录记录</span>
                  <p className="text-xs text-muted-foreground">查看最近的登录活动</p>
                </div>
                <Button variant="outline" size="sm">查看记录</Button>
              </div>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}
