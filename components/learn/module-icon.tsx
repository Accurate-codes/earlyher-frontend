import { Eye, Heart, Leaf, Stethoscope } from "@/components/ui/icons";
import type { EducationModule } from "@/lib/types/clinical";

const icons = { heart: Heart, eye: Eye, leaf: Leaf, stethoscope: Stethoscope };

/** Abstract symbol for a topic. Stands in until approved illustrations are supplied. */
export function ModuleIcon({ icon, large = false }: { icon: EducationModule["icon"]; large?: boolean }) {
  const Icon = icons[icon];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 ${large ? "size-24" : "size-14"}`}
    >
      <Icon className={large ? "size-12" : "size-7"} />
    </span>
  );
}
