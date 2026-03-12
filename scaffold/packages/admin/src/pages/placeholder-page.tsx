interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
