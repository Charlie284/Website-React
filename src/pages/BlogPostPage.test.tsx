import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BlogPostPage from "./BlogPostPage";

describe("article navigation", () => {
  it("keeps the archive search through an inline article link", async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: "/blog/why-i-hate-chatgpt-instant",
        state: { blogReturnTo: "/blog?q=instant" },
      }]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const inlineLink = await screen.findByRole("link", { name: "why I hate Opus 5" });
    fireEvent.click(inlineLink);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("WHY I HATE OPUS 5"));
    expect(screen.getByRole("link", { name: /Back to Blog/ })).toHaveAttribute("href", "/blog?q=instant");
  });
});
