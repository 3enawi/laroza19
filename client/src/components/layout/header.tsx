import { User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const today = new Date().toLocaleDateString('ar-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground" data-testid="text-today-date">
            اليوم: {today}
          </span>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="text-primary-foreground" size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
