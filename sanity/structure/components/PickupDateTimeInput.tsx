import { useCallback, useEffect, useState } from "react";
import { set, unset } from "sanity";
import type { StringInputProps } from "sanity";
import { Stack, Text, Flex, Box } from "@sanity/ui";
import { parsePickupLabel, pickupEdit } from "../../../lib/studio/pickup-label";

const inputStyle = {
  width: "100%",
  padding: 8,
  borderRadius: 4,
  border: "1px solid #c6cbd3",
  fontSize: 14,
  boxSizing: "border-box" as const,
};

export function PickupDateTimeInput(props: StringInputProps) {
  const { onChange, value, readOnly, renderDefault } = props;

  // Seeded from the order's own value, and re-seeded whenever it changes.
  // These used to start empty and stay empty, so the bakery saw two blank
  // boxes on an order that already had a date and time.
  const [dateVal, setDateVal] = useState(() => parsePickupLabel(value).date);
  const [timeVal, setTimeVal] = useState(() => parsePickupLabel(value).time);
  // Pickup and delivery are both windows — "10:00 a.m. - 12:00 p.m." — so the
  // end has a box of its own instead of being lost the moment anyone edits.
  const [endVal, setEndVal] = useState(() => parsePickupLabel(value).endTime);

  useEffect(() => {
    const parts = parsePickupLabel(value);
    setDateVal(parts.date);
    setTimeVal(parts.time);
    setEndVal(parts.endTime);
  }, [value]);

  const commit = useCallback(
    (d: string, t: string, e: string) => {
      const edit = pickupEdit(d, t, e);
      // "keep" is a time with no date: it cannot make a label, and writing an
      // empty one is what used to wipe an order's date the moment someone set
      // its time. Leave the stored value alone.
      if (edit.action === "keep") return;
      onChange(edit.action === "unset" ? unset() : set(edit.label));
    },
    [onChange]
  );

  if (readOnly) return renderDefault(props);

  const unreadable = Boolean(value) && !dateVal;

  return (
    <Stack space={2}>
      {value && (
        <Text size={1} muted>
          Current: {value}
        </Text>
      )}
      <Flex gap={2}>
        <Box flex={1}>
          <input
            type="date"
            aria-label="Pickup or delivery date"
            value={dateVal}
            onChange={(e) => {
              setDateVal(e.currentTarget.value);
              commit(e.currentTarget.value, timeVal, endVal);
            }}
            style={inputStyle}
          />
        </Box>
        <Box flex={1}>
          <input
            type="time"
            aria-label="Pickup or delivery time"
            value={timeVal}
            onChange={(e) => {
              setTimeVal(e.currentTarget.value);
              commit(dateVal, e.currentTarget.value, endVal);
            }}
            style={inputStyle}
          />
        </Box>
        <Box flex={1}>
          <input
            type="time"
            aria-label="End of the pickup or delivery window"
            value={endVal}
            onChange={(e) => {
              setEndVal(e.currentTarget.value);
              commit(dateVal, timeVal, e.currentTarget.value);
            }}
            style={inputStyle}
          />
        </Box>
      </Flex>
      <Text size={1} muted>
        Date, start, and end of the window. Leave the end empty for a single time.
      </Text>
      {unreadable && (
        <Text size={1} muted>
          Pick a date to replace the value above — it isn&apos;t in a format
          these boxes can read.
        </Text>
      )}
    </Stack>
  );
}
