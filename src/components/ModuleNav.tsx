import {
  LayoutDashboard, ShieldCheck, Star, Calendar,
  Users, ClipboardList, Flag, Heart,
  UserCheck, Stethoscope, MapPin,
} from 'lucide-react';
import type { ModuleDef, ModuleId } from '../data/modules';

// ---------------- ICON MAP ----------------

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShieldCheck,
  Star,
  Calendar,
  Users,
  ClipboardList,
  Flag,
  Heart,
  UserCheck,
  Stethoscope,
  MapPin,
};

// ---------------- TYPES ----------------

interface ModuleNavProps {
  modules: ModuleDef[];
  active: ModuleId;
  onChange: (id: ModuleId) => void;
}

// ---------------- COMPONENT ----------------

function ModuleNav({ modules, active, onChange }: ModuleNavProps) {
  return (
    <nav className="flex items-center gap-1 border-b border-border bg-background px-4">
      {modules.map((mod) => {
        const Icon = ICON_MAP[mod.icon];
        const isActive = mod.id === active;

        return (
          <button
            key={mod.id}
            onClick={() => onChange(mod.id)}
            title={mod.description}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {mod.label}
          </button>
        );
      })}
    </nav>
  );
}

export default ModuleNav;
