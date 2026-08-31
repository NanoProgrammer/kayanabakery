import { useCallback } from "react";
import { set, unset } from "sanity";
import type { StringInputProps } from "sanity";
import { TextInput } from "@sanity/ui";

// Live-formats a North American number as (403) 383-3681 while typing, so
// it doesn't come out as one stuck-together block of digits. Only used for
// manually-created orders — synced orders stay read-only plain text.
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function PhoneInput(props: StringInputProps) {
  const { onChange, value, readOnly, renderDefault } = props;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(event.currentTarget.value);
      onChange(formatted ? set(formatted) : unset());
    },
    [onChange]
  );

  if (readOnly) return renderDefault(props);

  return (
    <TextInput
      value={value ?? ""}
      onChange={handleChange}
      placeholder="(403) 383-3681"
      readOnly={readOnly}
    />
  );
}
