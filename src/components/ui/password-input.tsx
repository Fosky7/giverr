import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * PasswordInput — a reusable password field that wraps the shadcn {@link Input}
 * and renders a trailing Eye/EyeOff toggle button to show or hide the entered
 * value.
 *
 * Design notes:
 *  - Fully controlled pass-through: it does NOT own the password value. All
 *    native input props (value, onChange, name, autoComplete, required,
 *    minLength, disabled, placeholder, etc.) are spread onto the underlying
 *    input so form state, validation, and password-manager autofill keep
 *    working exactly as before.
 *  - The only local state is a boolean `visible` that swaps the input `type`
 *    between "password" and "text". Typing never flips visibility.
 *  - The toggle is `type="button"` so it never submits the surrounding form,
 *    is keyboard focusable (Enter/Space activate it), and exposes an
 *    accessible label + aria-pressed reflecting the current state.
 *  - Only design tokens are used for colors (text-muted-foreground /
 *    hover:text-foreground, focus-visible ring). No hardcoded colors.
 */
export type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    const toggle = React.useCallback(() => {
      setVisible((prev) => !prev);
    }, []);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          // Reserve space so entered text never sits under the icon button.
          className={cn("pr-10", className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={0}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-center px-3",
            "text-muted-foreground transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
