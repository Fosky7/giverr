// src/hooks/useContactForm.ts
import { useState, useCallback, type ChangeEvent, type FormEvent } from "react";
import { sendContactMessage, type ContactMessage } from "@/services/contact";

/** Per-field validation errors keyed by field name. */
type FieldErrors = Partial<
  Record<keyof Omit<ContactMessage, "">, string>
>;

/**
 * Validation rules applied client-side before submission.
 * Returns a map of field -> error message. An empty object means the form is valid.
 */
function validate(fields: ContactMessage): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Please enter your name.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fields.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!emailPattern.test(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }

  const trimmedMessage = fields.message.trim();
  if (!trimmedMessage) {
    errors.message = "Please write your message.";
  } else if (trimmedMessage.length < 10) {
    errors.message = "Message should be at least 10 characters.";
  } else if (trimmedMessage.length > 5000) {
    errors.message = "Message must be under 5000 characters.";
  }

  return errors;
}

/**
 * Return type for the `useContactForm` hook.
 */
export interface UseContactFormReturn {
  /** Current form field values. */
  values: ContactMessage;
  /** Per-field validation errors (populated after a failed submit). */
  fieldErrors: FieldErrors;
  /** A server-side error message, if the API returned an error. */
  serverError: string | null;
  /** Indicates the form is being submitted (loading state). */
  submitting: boolean;
  /** Whether the message was sent successfully (success state). */
  success: boolean;
  /** Callback for controlled input onChange events. */
  handleChange: (
    field: keyof ContactMessage,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Form onSubmit handler. */
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  /** Reset the form back to its initial state (for sending another message). */
  reset: () => void;
}

const INITIAL_VALUES: ContactMessage = {
  name: "",
  email: "",
  message: "",
};

/**
 * Custom hook to manage the contact form's state, validation and submission flow.
 *
 * Designed to keep the `<Contact>` page clean by encapsulating all the logic
 * that was previously inline.
 */
export function useContactForm(): UseContactFormReturn {
  const [values, setValues] = useState<ContactMessage>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /** Controlled input change handler. Clears the field's validation error. */
  const handleChange = useCallback(
    (field: keyof ContactMessage) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const nextValue = event.target.value;
        setValues((prev) => ({ ...prev, [field]: nextValue }));
        // Remove the error for this field once the user edits.
        setFieldErrors((prev) => {
          if (!prev[field]) return prev;
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      },
    [],
  );

  /** Form submit handler. Validates, then calls the stub service. */
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setServerError(null);
      setSuccess(false);

      const errors = validate(values);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        return;
      }

      setSubmitting(true);
      try {
        await sendContactMessage(values);
        setSuccess(true);
        // Reset the form after a successful send.
        setValues(INITIAL_VALUES);
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : "Something went wrong while sending your message. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [values],
  );

  /** Reset everything so the user can send another message. */
  const reset = useCallback(() => {
    setValues(INITIAL_VALUES);
    setFieldErrors({});
    setServerError(null);
    setSubmitting(false);
    setSuccess(false);
  }, []);

  return {
    values,
    fieldErrors,
    serverError,
    submitting,
    success,
    handleChange,
    handleSubmit,
    reset,
  };
}
