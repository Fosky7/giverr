// src/components/ui/date-picker.tsx
//
// Shadcn DatePicker primitive: a Calendar wrapped in a Popover, exposed as a
// controlled component that emits/accepts an ISO date string (YYYY-MM-DD) so it
// plugs directly into react-hook-form fields (e.g. the campaign deadline).
//
// Usage:
//   <FormField name="deadline" control={form.control} render={({ field }) => (
//     <FormItem>
//       <FormLabel>Deadline</FormLabel>
//       <FormControl>
//         <DatePicker value={field.value} onChange={field.onChange} minDate={new Date()} />
//       </FormControl>
//       <FormMessage />
//     </FormItem>
//   )} />

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  /** Selected date as an ISO string (YYYY-MM-DD) or empty string. */
  value?: string;
  /** Called with the new ISO date string (or "" when cleared). */
  onChange?: (value: string) => void;
  /** Placeholder shown when no date is selected. */
  placeholder?: string;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Earliest selectable date (inclusive). Days before are disabled. */
  minDate?: Date;
  /** Latest selectable date (inclusive). Days after are disabled. */
  maxDate?: Date;
  /** Extra classes for the trigger button. */
  className?: string;
  /** Optional id for label association. */
  id?: string;
}

/** Safely parse the incoming ISO string into a Date (or undefined). */
function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

/**
 * Accessible date picker. Renders a button showing the formatted selection and
 * opens a Calendar in a popover. Emits the picked date as an ISO `YYYY-MM-DD`
 * string via `onChange`, which is what the campaign form schema validates.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  minDate,
  maxDate,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  // Normalize the min date to the start of its day so "today" stays selectable.
  const minDay = React.useMemo(() => {
    if (!minDate) return undefined;
    const d = new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("");
      return;
    }
    // Emit a timezone-stable YYYY-MM-DD string.
    onChange?.(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          disabled={(date) => {
            if (minDay && date < minDay) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
