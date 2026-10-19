import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hasConfirmedNewsletterSubscription,
  setCookieConsentChoice,
} from "../lib/newsletterPreferences";
import NewsletterConfirmed from "./NewsletterConfirmed";
import NewsletterSignup from "../components/NewsletterSignup";

function clearNewsletterCookies() {
  document.cookie = "clh_cookie_choice=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_signup_submitted=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_subscription_confirmed=; Path=/; Max-Age=0";
  document.cookie = "clh_newsletter_last_visit=; Path=/; Max-Age=0";
}

describe("NewsletterConfirmed", () => {
  beforeEach(clearNewsletterCookies);
  afterEach(clearNewsletterCookies);

  it("does not treat a direct route visit as proof of confirmation", () => {
    setCookieConsentChoice("allow");

    render(
      <MemoryRouter>
        <NewsletterConfirmed />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "You’re subscribed." })).not.toBeInTheDocument();
    expect(screen.queryByText(/did not allow preference cookies/i)).not.toBeInTheDocument();
    expect(hasConfirmedNewsletterSubscription()).toBe(false);
  });

  it("persists an explicit prompt preference and hides other signup forms", () => {
    setCookieConsentChoice("allow");
    render(
      <MemoryRouter>
        <NewsletterConfirmed />
        <NewsletterSignup source="blog" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("textbox", { name: "Email address" })).toBeInTheDocument();
    const hide = screen.getByRole("button", { name: "Hide signup prompts" });
    hide.focus();
    fireEvent.click(hide);
    expect(hasConfirmedNewsletterSubscription()).toBe(true);
    expect(screen.queryByRole("textbox", { name: "Email address" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Signup prompts are hidden." })).toHaveFocus();
  });

  it("does not save a preference without consent and updates when consent changes", () => {
    setCookieConsentChoice("deny");

    render(
      <MemoryRouter>
        <NewsletterConfirmed />
      </MemoryRouter>,
    );

    const hide = screen.getByRole("button", { name: "Hide signup prompts" });
    expect(hide).toBeDisabled();
    fireEvent.click(hide);
    expect(hasConfirmedNewsletterSubscription()).toBe(false);

    act(() => setCookieConsentChoice("allow"));
    expect(hide).toBeEnabled();
    expect(screen.queryByText(/did not allow preference cookies/i)).not.toBeInTheDocument();
    fireEvent.click(hide);
    expect(hasConfirmedNewsletterSubscription()).toBe(true);

    act(() => setCookieConsentChoice("deny"));
    expect(hasConfirmedNewsletterSubscription()).toBe(false);
    expect(screen.getByRole("button", { name: "Hide signup prompts" })).toBeDisabled();
  });
});
