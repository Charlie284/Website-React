import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CommandPalette from "./CommandPalette";

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe("command palette", () => {
  it("does not steal focus when Escape is pressed while closed", async () => {
    render(
      <MemoryRouter>
        <label>
          Page search
          <input />
        </label>
        <CommandPalette />
      </MemoryRouter>,
    );

    const pageSearch = screen.getByRole("textbox", { name: "Page search" });
    pageSearch.focus();

    fireEvent.keyDown(window, { key: "Escape" });
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    expect(pageSearch).toHaveFocus();
  });

  it("filters commands and navigates from the keyboard", async () => {
    render(
      <MemoryRouter>
        <CommandPalette />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "/" });

    const dialog = await screen.findByRole("dialog", { name: "Command palette" });
    const search = screen.getByRole("combobox", { name: "Search commands" });
    expect(dialog).toBeVisible();
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: "writing" } });

    expect(screen.getByRole("option", { name: /Blog/i })).toBeVisible();
    expect(screen.queryByRole("option", { name: /Home/i })).not.toBeInTheDocument();

    fireEvent.keyDown(search, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(
        "/blog",
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps cookie choices discoverable from every route", async () => {
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <CommandPalette />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "/" });
    const search = await screen.findByRole("combobox", {
      name: "Search commands",
    });
    fireEvent.change(search, { target: { value: "cookies" } });

    expect(
      screen.getByRole("option", { name: /Privacy and cookie choices/i }),
    ).toBeVisible();
    fireEvent.keyDown(search, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(
        "/privacy",
      );
    });
  });

  it("moves option focus and selection together with arrow keys", async () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "/" });
    const search = await screen.findByRole("combobox", { name: "Search commands" });
    const home = screen.getByRole("option", { name: /Home/i });
    const projects = screen.getByRole("option", { name: /Projects/i });
    const email = screen.getByRole("option", { name: /Email/i });

    act(() => home.focus());
    fireEvent.keyDown(home, { key: "ArrowDown" });
    expect(projects).toHaveFocus();
    expect(projects).toHaveAttribute("aria-selected", "true");
    expect(home).toHaveAttribute("aria-selected", "false");
    expect(search).toHaveAttribute("aria-activedescendant", projects.id);

    fireEvent.keyDown(projects, { key: "ArrowUp" });
    expect(home).toHaveFocus();
    fireEvent.keyDown(home, { key: "ArrowUp" });
    expect(home).toHaveFocus();
    expect(search).toHaveAttribute("aria-activedescendant", home.id);

    act(() => email.focus());
    fireEvent.keyDown(email, { key: "ArrowDown" });
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-selected", "true");
    expect(search).toHaveAttribute("aria-activedescendant", email.id);

    fireEvent.change(search, { target: { value: "writing" } });
    const blog = screen.getByRole("option", { name: /Blog/i });
    act(() => blog.focus());
    fireEvent.keyDown(blog, { key: "ArrowUp" });
    fireEvent.keyDown(blog, { key: "ArrowDown" });
    expect(blog).toHaveFocus();
    expect(search).toHaveAttribute("aria-activedescendant", blog.id);
  });

  it("keeps combobox arrow navigation and the dialog Tab trap", async () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "/" });
    const search = await screen.findByRole("combobox", { name: "Search commands" });
    const projects = screen.getByRole("option", { name: /Projects/i });
    const email = screen.getByRole("option", { name: /Email/i });

    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(search).toHaveFocus();
    expect(projects).toHaveAttribute("aria-selected", "true");
    expect(search).toHaveAttribute("aria-activedescendant", projects.id);

    fireEvent.keyDown(search, { key: "Tab", shiftKey: true });
    expect(email).toHaveFocus();
    fireEvent.keyDown(email, { key: "Tab" });
    expect(search).toHaveFocus();
  });
});
