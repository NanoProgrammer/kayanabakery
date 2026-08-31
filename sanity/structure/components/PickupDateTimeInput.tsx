import { useCallback, useState } from "react";
import { set, unset } from "sanity";
import type { StringInputProps } from "sanity";
import { Stack, Text, Flex, Box } from "@sanity/ui";

// pickupDate is a single free-text field shared with synced orders, which
// store an already-formatted label from the checkout flow (e.g.
// "Thursday, Aug 28, 1:00 p.m."). Rather than change its type — and risk
// breaking every existing synced order's display — this renders real
// date/time pickers for manual entry and writes a matching formatted
// string into that same field, so the format is consistent either way.
function formatDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dateLabel = date.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  if (!timeStr) return dateLabel;
  const [hh, mm] = timeStr.split(":").map(Number);
  const period = hh >= 12 ? "p.m." : "a.m.";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  const timeLabel = `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
  return `${dateLabel} · ${timeLabel}`;
}

export function PickupDateTimeInput(props: StringInputProps) {
  const { onChange, value, readOnly, renderDefault } = props;
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");

  const commit = useCallback(
    (d: string, t: string) => {
      const formatted = formatDateTime(d, t);
      onChange(formatted ? set(formatted) : unset());
    },
    [onChange]
  );

  if (readOnly) return renderDefault(props);

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
            value={dateVal}
            onChange={(e) => {
              setDateVal(e.currentTarget.value);
              commit(e.currentTarget.value, timeVal);
            }}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #c6cbd3",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </Box>
        <Box flex={1}>
          <input
            type="time"
            value={timeVal}
            onChange={(e) => {
              setTimeVal(e.currentTarget.value);
              commit(dateVal, e.currentTarget.value);
            }}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #c6cbd3",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </Box>
      </Flex>
    </Stack>
  );
}
