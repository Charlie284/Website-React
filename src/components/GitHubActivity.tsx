import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";

export default function GitHubActivity() {
  return (
    <a
      href="https://github.com/Charlie284/"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-16 flex-wrap items-center justify-between gap-6 border-y border-white/10 py-6 text-white"
    >
      <span className="flex items-center gap-4">
        <GithubIcon className="h-6 w-6 shrink-0 text-white/70" />
        <span>
          <span className="block font-serif text-xl uppercase">Most of my code lives on GitHub.</span>
          <span className="mt-2 block text-sm leading-relaxed text-white/70">You can see what I am building and what changed recently.</span>
        </span>
      </span>
      <span className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
        Open my GitHub <ArrowUpRight size={16} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}
