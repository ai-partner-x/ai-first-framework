import { useAppConfig } from "@/providers/app-config"
import { useLogout } from "@scaffold/core"
// import { useNavigate } from "react-router"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/admin-ui/theme/theme-toggle"
import { LanguageSwitcher } from "@/components/admin-ui/layout/language-switcher"
import { UserAvatar } from "@/components/admin-ui/layout/user-avatar"
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar"
import { LogOutIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export const Header = () => {
  const { isMobile } = useSidebar()

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>
}

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-end",
        "z-40"
      )}
    >
      <LanguageSwitcher />
      <ThemeToggle />
      <UserDropdown />
    </header>
  )
}

function MobileHeader() {
  const { open, isMobile } = useSidebar()
  const { title } = useAppConfig()

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40"
      )}
    >
      <SidebarTrigger
        className={cn("text-muted-foreground", "rotate-180", "ml-1", {
          "opacity-0": open,
          "opacity-100": !open || isMobile,
          "pointer-events-auto": !open || isMobile,
          "pointer-events-none": open && !isMobile,
        })}
      />

      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          {
            "pl-3": !open,
            "pl-5": open,
          }
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm",
            "font-bold",
            "transition-opacity",
            "duration-200",
            {
              "opacity-0": !open,
              "opacity-100": open,
            }
          )}
        >
          {title.text}
        </h2>
      </div>

      <ThemeToggle className={cn("h-8", "w-8")} />
    </header>
  )
}

const UserDropdown = () => {
  const { t } = useTranslation()
  // const navigate = useNavigate()
  const { mutate: logout } = useLogout()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon
            className={cn("text-destructive", "hover:text-destructive")}
          />
          <span className={cn("text-destructive", "hover:text-destructive")}>
            {t("header.logout")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

Header.displayName = "Header"
MobileHeader.displayName = "MobileHeader"
DesktopHeader.displayName = "DesktopHeader"
