import { useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

const subscribe = () => () => {};

export function usePrerenderedReturnTo(basePath: "/projects" | "/blog") {
  const state: unknown = useLocation().state;
  const savedReturn = typeof state === "object" && state !== null
    ? basePath === "/projects"
      ? "projectsReturnTo" in state ? state.projectsReturnTo : undefined
      : "blogReturnTo" in state ? state.blogReturnTo : undefined
    : undefined;
  const returnTo = typeof savedReturn === "string" && (savedReturn === basePath || savedReturn.startsWith(`${basePath}?`))
    ? savedReturn : basePath;

  // Static HTML has no browser history state. Restore its return destination
  // after hydration while keeping client navigation immediate.
  return useSyncExternalStore(subscribe, () => returnTo, () => basePath);
}
