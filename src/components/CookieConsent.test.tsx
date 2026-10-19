import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getCookieConsentChoice,
  markNewsletterSubscriptionConfirmed,
  setCookieConsentChoice,
} from "../lib/newsletterPreferences";
import CookieConsent from "./CookieConsent";

const siteCookies = [
  "clh_cookie_choice",
  "clh_newsletter_signup_submitted",
  "clh_newsletter_subscription_confirmed",
  "clh_newsletter_last_visit",
];

function clearSiteCookies() {
  siteCookies.forEach((name) => {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  });
}

describe("CookieConsent", () => {
  beforeEach(clearSiteCookies);
  afterEach(clearSiteCookies);

  it("offers allow and decline choices before setting newsletter cookies", () => {
    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Allow cookies" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "No thanks" })).toBeEnabled();
    expect(document.cookie).not.toContain("clh_newsletter_last_visit");
  });

  it("records consent and starts the visit window when allowed", () => {
    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Allow cookies" }));

    expect(getCookieConsentChoice()).toBe("allow");
    expect(document.cookie).toContain("clh_newsletter_last_visit");
    expect(
      screen.queryByRole("button", { name: "Allow cookies" }),
    ).not.toBeInTheDocument();
  });

  it("removes newsletter preferences when declined", () => {
    setCookieConsentChoice("allow");
    markNewsletterSubscriptionConfirmed();
    document.cookie = "clh_cookie_choice=; Path=/; Max-Age=0";

    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "No thanks" }));

    expect(getCookieConsentChoice()).toBe("deny");
    expect(document.cookie).not.toContain("clh_newsletter_signup_submitted");
    expect(document.cookie).not.toContain(
      "clh_newsletter_subscription_confirmed",
    );
    expect(document.cookie).not.toContain("clh_newsletter_last_visit");
  });
});
