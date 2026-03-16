import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function UserAvatar() {
  const { t } = useTranslation();
  const user = {
    fullName: t("user.defaultName"),
    avatar: undefined as string | undefined,
  };
  const { fullName, avatar } = user;

  return (
    <Avatar className={cn("h-10", "w-10")}>
      {avatar && <AvatarImage src={avatar} alt={fullName} />}
      <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
    </Avatar>
  );
}

const getInitials = (name = "") => {
  const names = name.split(" ");
  let initials = names[0].substring(0, 1).toUpperCase();

  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

UserAvatar.displayName = "UserAvatar";
