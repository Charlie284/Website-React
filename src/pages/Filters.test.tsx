import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BlogPage from "./BlogPage";
import Projects from "./Projects";

describe("saved filters", () => {
  it.each([
    { Page: Projects, path: "/projects", query: "?technology=Flutter&status=In+progress", label: "Technology", value: "Flutter" },
    { Page: BlogPage, path: "/blog", query: "?q=tailscale&tag=networking&sort=oldest", label: "Search blog posts", value: "tailscale" },
  ])("hydrates $path with URL filters without replacing the prerendered page", ({ Page, path, query, label, value }) => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    const onRecoverableError = vi.fn();

    render(<MemoryRouter initialEntries={[path + query]}><Page /></MemoryRouter>, {
      container,
      hydrate: true,
      onRecoverableError,
    });

    expect(screen.getByLabelText(label)).toHaveValue(value);
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("allows All as search text independently of the All tags option", () => {
    render(<MemoryRouter><BlogPage /></MemoryRouter>);
    const search = screen.getByRole("textbox", { name: "Search blog posts" });
    fireEvent.change(search, { target: { value: "All" } });
    expect(search).toHaveValue("All");
  });
});
