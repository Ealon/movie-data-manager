import { MagnetIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Link } from "@/generated/prisma";

const MagnetLinks = ({ links, className }: { links: Link[]; className?: string }) => {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3 backdrop-blur-sm rounded-xl p-3", className)}>
      {links.map((l) => {
        const label = `${l.quality.replace(/2160p/gim, "4K")} (${l.source.replace(/BluRay/gim, "BD")}) - ${l.size}`;
        const href = l.download ?? l.magnet ?? "#";

        return (
          <a
            key={l.id}
            href={href}
            className={cn(
              "flex items-center gap-1 underline font-medium underline-offset-1 hover:text-blue-400 mx-auto w-fit",
              /(1080p)|(2160p)/gim.test(l.quality) && /blu/gim.test(l.source)
                ? "text-amber-500 hover:text-yellow-400"
                : "text-indigo-500 hover:text-blue-400",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MagnetIcon className="size-4" />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
};

export default MagnetLinks;
