import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hasConfirmedNewsletterSubscription,
  markNewsletterSubscriptionConfirmed,
  setCookieConsentChoice,
} from "../lib/newsletterPreferences";
import NewsletterSignup from "./NewsletterSignup";

function clearNewsletterCookies() {
  document.cookie = "clh_cookie_choice=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_signup_submitted=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_subscription_confirmed=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_last_visit=; Path=/; Max-Age=0";
}

describe("NewsletterSignup", () => {
  beforeEach(() => {
    clearNewsletterCookies();
    setCookieConsentChoice("allow");
  });
  afterEach(() => {
    clearNewsletterCookies();
  });

  it("describes the newsletter and exposes the privacy link", () => {
    render(
      <MemoryRouter>
        <NewsletterSignup source="blog" />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Still learning." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Every so often, I write about something I built/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "privacy note" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("posts email addresses to the published Kit form", () => {
    render(
      <MemoryRouter>
        <NewsletterSignup source="article" />
      </MemoryRouter>,
    );

    const email = screen.getByLabelText("Email address");
    const form = email.closest("form");

    expect(email).toBeEnabled();
    expect(screen.getByRole("button", { name: /send me new posts/i })).toBeEnabled();
    expect(form).toHaveAttribute(
      "action",
      "https://app.kit.com/forms/9788220/subscriptions",
    );
    expect(form).toHaveAttribute("method", "post");
  });

  it("does not hide future prompts when a submission is started", () => {
    render(
      <MemoryRouter>
        <NewsletterSignup source="article" />
      </MemoryRouter>,
    );

    const form = screen.getByLabelText("Email address").closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(hasConfirmedNewsletterSubscription()).toBe(false);
  });

  it("does not render after a subscription was confirmed", () => {
    markNewsletterSubscriptionConfirmed();

    render(
      <MemoryRouter>
        <NewsletterSignup source="home" />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: "Still learning." }),
    ).not.toBeInTheDocument();
  });
});
