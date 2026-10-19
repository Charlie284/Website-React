import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppContent, type AppPageComponents } from "./App";

const Page = ({ title }: { title: string }) => <h1>{title}</h1>;

describe("project routes", () => {
  it("renders the Startle case study at its own route", async () => {
    const pages = {
      Home: () => <Page title="Home" />,
      Projects: () => <Page title="Projects" />,
      BlogPage: () => <Page title="Blog" />,
      BlogPostPage: () => <Page title="Post" />,
      Privacy: () => <Page title="Privacy" />,
      NewsletterConfirmed: () => <Page title="Newsletter" />,
      NotFound: () => <Page title="Not found" />,
      Server: () => <Page title="Server" />,
      ThisWebsite: () => <Page title="Website" />,
      NewTrierBlock: () => <Page title="New Trier Block case study" />,
      Startle: () => <Page title="Startle case study" />,
    } as unknown as AppPageComponents;

    render(
      <MemoryRouter initialEntries={["/projects/startle"]}>
        <AppContent pages={pages} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Startle case study" }),
    ).toBeInTheDocument();
  });
});
