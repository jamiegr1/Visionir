"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Blocks,
  Palette,
  Rocket,
  Settings,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
};

function NavItem({ href, label, icon, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cx(
        "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
        active
          ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          : "text-slate-500 hover:text-white"
      )}
      aria-label={label}
    >
      {active && (
        <span className="absolute -left-3 h-6 w-1 rounded-full bg-[#4f8cff]" />
      )}

      <span
        className={cx(
          "transition-all duration-200",
          active ? "opacity-100" : "opacity-80 group-hover:opacity-100"
        )}
      >
        {icon}
      </span>

      <span className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#111827] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      href: "/blocks/new",
      label: "Generate Block",
      icon: <Sparkles className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      href: "/blocks",
      label: "Block Library",
      icon: <Blocks className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      href: "/brand",
      label: "Brand System",
      icon: <Palette className="h-5 w-5" strokeWidth={1.9} />,
    },
    {
      href: "/deployment",
      label: "Deployment",
      icon: <Rocket className="h-5 w-5" strokeWidth={1.9} />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    }

    if (href === "/blocks/new") return pathname === "/blocks/new";
    if (href === "/blocks") return pathname === "/blocks";
    if (href === "/brand") return pathname === "/brand";

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="relative flex h-[calc(100dvh-72px)] min-h-[calc(100dvh-72px)] w-[88px] shrink-0 flex-col items-center border-r border-white/10 bg-[#0a0c14] px-3 py-4 text-white">
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      <Link
        href="/dashboard"
        prefetch={false}
        className="mb-8 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
        aria-label="Visionir dashboard"
      >
        <img
          src="/kiwalogo.png"
          alt="Kiwa"
          className="h-7 w-7 object-contain"
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-3">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      <div className="mt-4 flex flex-col items-center gap-3">
        <NavItem
          href="/settings"
          label="Settings"
          icon={<Settings className="h-5 w-5" strokeWidth={1.9} />}
          active={pathname === "/settings" || pathname.startsWith("/settings/")}
        />
      </div>
    </aside>
  );
}