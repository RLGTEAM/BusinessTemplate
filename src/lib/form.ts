import { PUBLIC_WEB3FORMS_KEY } from "astro:env/client";

/**
 * Headless contact-form plumbing. The model designs 100% of the form's
 * markup and look; this module provides the tested logic: validation,
 * Web3Forms submission, and idle/sending/success/error states.
 *
 * Markup contract (docs/RECIPES.md): <form data-contact-form> with
 * data-{sending-label,submit-label,success-message,error-message,
 * required-error,email-error,subject}; required fields have an id and an
 * error element with id `${id}-error`; a [data-form-status] element with
 * role="status" aria-live="polite"; optional honeypot input name="botcheck".
 *
 * Wired once in BaseLayout on astro:page-load — a page without a matching
 * form costs nothing.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldError(input: HTMLInputElement | HTMLTextAreaElement, form: HTMLFormElement): string {
  const value = input.value.trim();
  if (value === "") return form.dataset.requiredError ?? "";
  if (input.type === "email" && !EMAIL_PATTERN.test(value)) {
    return form.dataset.emailError ?? "";
  }
  return "";
}

function validate(form: HTMLFormElement): boolean {
  let firstInvalid: HTMLElement | null = null;
  for (const input of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "input[required], textarea[required]",
  )) {
    const message = fieldError(input, form);
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle("hidden", message === "");
    }
    input.setAttribute("aria-invalid", message === "" ? "false" : "true");
    if (message !== "" && !firstInvalid) firstInvalid = input;
  }
  firstInvalid?.focus();
  return firstInvalid === null;
}

function showStatus(form: HTMLFormElement, kind: "success" | "error"): void {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  if (!status) return;
  status.textContent =
    kind === "success" ? (form.dataset.successMessage ?? "") : (form.dataset.errorMessage ?? "");
  status.classList.remove("hidden");
  status.dataset.state = kind;
}

async function submit(form: HTMLFormElement): Promise<void> {
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
  if (!button) return;

  button.disabled = true;
  button.textContent = form.dataset.sendingLabel ?? "";
  try {
    const formData = new FormData(form);
    formData.append("access_key", PUBLIC_WEB3FORMS_KEY);
    formData.append("subject", form.dataset.subject ?? "");
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
    const result: unknown = await response.json();
    const ok =
      typeof result === "object" &&
      result !== null &&
      "success" in result &&
      result.success === true;
    showStatus(form, ok ? "success" : "error");
    if (ok) form.reset();
  } catch {
    showStatus(form, "error");
  } finally {
    button.disabled = false;
    button.textContent = form.dataset.submitLabel ?? "";
  }
}

function bind(form: HTMLFormElement): void {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
    if (button?.disabled) return; // a submission is already in flight
    if (!validate(form)) return;
    if (PUBLIC_WEB3FORMS_KEY === "") {
      // Endpoint not configured — surface the error state instead of a silent no-op.
      showStatus(form, "error");
      return;
    }
    void submit(form);
  });
}

export function setupContactForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>("form[data-contact-form]")) {
    bind(form);
  }
}
