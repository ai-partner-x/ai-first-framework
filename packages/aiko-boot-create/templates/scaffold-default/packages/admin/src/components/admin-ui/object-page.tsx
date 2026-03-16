/**
 * ObjectPage 通用组件
 * 基于 SAP Fiori Object Page Floorplan 设计
 * 支持三种模式：display（详情）、edit（编辑）、create（创建）
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { ArrowLeft, FileText, Info } from 'lucide-react'

// ============ 图标 ============
const Icons = {
  back: <ArrowLeft className="h-4 w-4" />,
  edit: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  save: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h8l3 3v9a1 1 0 01-1 1z" />
      <path d="M10 2v3H6M5 9h6M5 12h6" strokeLinecap="round" />
    </svg>
  ),
  more: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  ),
  info: <Info className="h-4 w-4" />,
  doc: <FileText className="h-5 w-5" />,
}

// ============ 类型定义 ============
export type ObjectPageMode = 'display' | 'edit' | 'create'

export interface ObjectPageAction {
  key: string
  label: string
  icon?: ReactNode
  /** 按钮样式：primary(蓝色), success(绿色), secondary(透明+边框), danger(红色), ghost(无边框) */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  /** 在哪些模式下显示 */
  showInModes?: ObjectPageMode[]
  /** 按钮位置：header(头部) 或 footer(底部粘浮)，默认 edit/create 模式放 footer */
  position?: 'header' | 'footer'
  /** 是否显示下拉箭头（仅 primary/success 有效） */
  showDropdown?: boolean
}

export interface ObjectPageSection {
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  /** 渲染内容 */
  content: ReactNode
  /** 在哪些模式下隐藏 */
  hideInModes?: ObjectPageMode[]
  /** 是否放在侧边栏（仅 display/edit 模式有效） */
  sidebar?: boolean
}

export interface ObjectPageHeaderField {
  icon?: ReactNode
  label: string
  value: string | ReactNode
}

export interface ObjectPageKPI {
  value: string | number
  label: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'gray'
}

export interface ObjectPageProps {
  /** 模式 */
  mode: ObjectPageMode
  /** 返回路径 */
  backPath: string
  /** 面包屑文本 */
  breadcrumb: string
  /** 标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** 状态标签 */
  status?: {
    label: string
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  }
  /** Header 图标 */
  headerIcon?: ReactNode
  /** Header 字段（关键信息区） */
  headerFields?: ObjectPageHeaderField[]
  /** KPI 指标 */
  kpis?: ObjectPageKPI[]
  /** 操作指南/提示信息 */
  tips?: string[]
  /** Sections */
  sections: ObjectPageSection[]
  /** 操作按钮 */
  actions?: ObjectPageAction[]
  /** 是否显示 Section 导航 */
  showSectionNav?: boolean
  /** 底部栏左侧内容（如“有未保存的更改”） */
  footerLeft?: ReactNode
  /** 自定义 className */
  className?: string
}

// ============ 组件实现 ============
export function ObjectPage({
  mode,
  backPath,
  breadcrumb,
  title,
  subtitle,
  status,
  headerIcon,
  headerFields = [],
  kpis = [],
  tips = [],
  sections,
  actions = [],
  showSectionNav = true,
  footerLeft,
  className,
}: ObjectPageProps) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')

  // 过滤当前模式可见的 Sections
  const visibleSections = sections.filter(
    (s) => !s.hideInModes?.includes(mode)
  )
  const mainSections = visibleSections.filter((s) => !s.sidebar)
  const sidebarSections = visibleSections.filter((s) => s.sidebar)

  // 过滤当前模式可见的 Actions
  const visibleActions = actions.filter(
    (a) => !a.showInModes || a.showInModes.includes(mode)
  )

  // 分离 header 和 footer actions
  // display 模式：所有按钮在 header
  // edit/create 模式：默认放 footer，除非明确指定 position='header'
  const headerActions = visibleActions.filter((a) => {
    if (mode === 'display') return true
    return a.position === 'header'
  })
  const footerActions = visibleActions.filter((a) => {
    if (mode === 'display') return false
    return a.position !== 'header'
  })

  // 滚动到指定 Section
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 导航的 Sections（包含 sidebar sections）
  const navSections = visibleSections.filter((s) => !s.sidebar || mode !== 'create')

  // KPI 颜色映射
  const kpiColorMap = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  }

  // 状态颜色映射
  const statusColorMap = {
    blue: 'bg-blue-100/80 text-blue-700',
    green: 'bg-emerald-100/80 text-emerald-700',
    yellow: 'bg-amber-100/80 text-amber-700',
    red: 'bg-red-100/80 text-red-700',
    gray: 'bg-gray-100/80 text-gray-700',
  }

  // 按钮样式
  const buttonVariants = {
    primary: 'bg-white/20 hover:bg-white/30 text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white/90',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-white',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-white',
    ghost: 'hover:bg-white/10 text-white/80',
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Object Page Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 彩色标题区 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 relative overflow-hidden">
          {/* 装饰圆形 */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-1/2 right-16 -translate-y-1/2 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative z-10">
            {/* 面包屑 */}
            <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
              <button
                onClick={() => navigate(backPath)}
                className="hover:text-white flex items-center gap-1"
              >
                {Icons.back}
                {breadcrumb}
              </button>
              <span>/</span>
              <span className="text-white">{title}</span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  {headerIcon || Icons.doc}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-semibold">{title}</h1>
                    {status && mode !== 'create' && (
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          status.color
                            ? statusColorMap[status.color]
                            : 'bg-white/20'
                        )}
                      >
                        {status.label}
                      </span>
                    )}
                    {mode === 'create' && (
                      <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium">
                        新建
                      </span>
                    )}
                    {mode === 'edit' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-400/30 text-xs font-medium">
                        编辑中
                      </span>
                    )}
                  </div>
                  {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
                </div>
              </div>

              {/* 头部操作按钮 */}
              <div className="flex items-center gap-2">
                {headerActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={action.onClick}
                    disabled={action.disabled || action.loading}
                    className={cn(
                      'h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50',
                      buttonVariants[action.variant || 'primary']
                    )}
                  >
                    {action.loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      action.icon
                    )}
                    <span>{action.label}</span>
                  </button>
                ))}
                <button className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  {Icons.info}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 关键信息区 */}
        {headerFields.length > 0 && (
          <div className="p-6 border-b border-gray-100">
            <div
              className={cn(
                'grid gap-6',
                headerFields.length <= 2
                  ? 'grid-cols-2'
                  : headerFields.length <= 4
                    ? 'grid-cols-2 md:grid-cols-4'
                    : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
              )}
            >
              {headerFields.map((field, index) => (
                <div key={index} className="flex items-center gap-3">
                  {field.icon && (
                    <span className="text-gray-400">{field.icon}</span>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">{field.label}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI 指标区 */}
        {kpis.length > 0 && mode !== 'create' && (
          <div className="p-6 bg-gray-50/50">
            <div
              className={cn(
                'grid gap-6 text-center',
                kpis.length <= 3 ? `grid-cols-${kpis.length}` : 'grid-cols-3'
              )}
            >
              {kpis.map((kpi, index) => (
                <div key={index}>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      kpiColorMap[kpi.color || 'blue']
                    )}
                  >
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作指南/提示信息 */}
        {tips.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
              {tips.map((tip, index) => (
                <span key={index}>{tip}</span>
              ))}
            </div>
          </div>
        )}

        {/* Section 导航 */}
        {showSectionNav && navSections.length > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-white sticky top-14 z-10">
            <nav className="flex gap-1">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* 内容区 */}
      {sidebarSections.length > 0 && mode !== 'create' ? (
        // 有侧边栏的布局
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-6">
            {mainSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                mode={mode}
              />
            ))}
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {sidebarSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                mode={mode}
                compact
              />
            ))}
          </div>
        </div>
      ) : (
        // 无侧边栏的布局
        <div className="space-y-6">
          {mainSections.map((section) => (
            <SectionCard key={section.id} section={section} mode={mode} />
          ))}
        </div>
      )}

      {/* 底部粘浮工具栏 - 仅在 edit/create 模式显示 */}
      {footerActions.length > 0 && (
        <div className="fixed m-0 bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className={cn(
            "max-w-7xl mx-auto px-6 py-3 flex items-center gap-3",
            footerLeft ? "justify-between" : "justify-end"
          )}>
            {footerLeft && <div className="text-sm text-muted-foreground">{footerLeft}</div>}
            <div className="flex items-center gap-3">
              {footerActions.map((action) => {
                const variant = action.variant || 'primary'
                const hasDropdown = action.showDropdown && (variant === 'primary' || variant === 'success')

                // Footer 按钮样式
                const footerButtonStyles = {
                  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
                  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
                  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
                  danger: 'bg-red-600 hover:bg-red-700 text-white',
                  ghost: 'hover:bg-gray-100 text-gray-600',
                }

                const dropdownBorderStyles = {
                  primary: 'border-blue-500 bg-blue-600 hover:bg-blue-700',
                  success: 'border-emerald-500 bg-emerald-600 hover:bg-emerald-700',
                }

                return (
                  <div key={action.key} className="flex items-center">
                    <button
                      onClick={action.onClick}
                      disabled={action.disabled || action.loading}
                      className={cn(
                        'h-10 px-5 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50',
                        footerButtonStyles[variant],
                        hasDropdown ? 'rounded-l-lg' : 'rounded-lg'
                      )}
                    >
                      {action.loading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        action.icon
                      )}
                      <span>{action.label}</span>
                    </button>
                    {/* 下拉箭头 */}
                    {hasDropdown && (
                      <button
                        disabled={action.disabled || action.loading}
                        className={cn(
                          'h-10 px-2 text-white border-l rounded-r-lg flex items-center disabled:opacity-50',
                          dropdownBorderStyles[variant as 'primary' | 'success']
                        )}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 底部占位空间 - 避免内容被 footer 遮挡 */}
      {footerActions.length > 0 && <div className="h-20" />}
    </div>
  )
}

// ============ Section Card 组件 ============
interface SectionCardProps {
  section: ObjectPageSection
  mode: ObjectPageMode
  compact?: boolean
}

function SectionCard({ section, compact }: SectionCardProps) {
  return (
    <div
      id={`section-${section.id}`}
      className="bg-white rounded-xl border border-gray-200 shadow-sm scroll-mt-32"
    >
      <div
        className={cn(
          'border-b border-gray-100 bg-gray-50/50 flex items-center gap-2',
          compact ? 'px-4 py-3' : 'px-6 py-4'
        )}
      >
        {section.icon && (
          <span className="text-gray-500">{section.icon}</span>
        )}
        <div>
          <h2
            className={cn(
              'font-semibold text-gray-900',
              compact ? 'text-sm' : ''
            )}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
          )}
        </div>
      </div>
      <div className={cn(compact ? 'p-4' : 'p-6', 'rounded-b-xl')}>{section.content}</div>
    </div>
  )
}

// ============ 导出辅助组件 ============
export { SectionCard }

// ============ 常用图标导出 ============
export const ObjectPageIcons = Icons

export default ObjectPage
