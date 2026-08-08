"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import { HighlightText } from "@/features/processes/components/highlight-text";
import { PROCESS_NAME_MAX_LENGTH, truncateText } from "@/utils/format";

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  query?: string;
  sx?: SxProps<Theme>;
}

export function TruncatedText({
  text,
  maxLength = PROCESS_NAME_MAX_LENGTH,
  query = "",
  sx,
}: TruncatedTextProps) {
  const displayText = truncateText(text, maxLength);
  const isTruncated = text.length > maxLength;
  const content = <HighlightText text={displayText} query={query} />;

  if (!isTruncated) {
    return <Box component="span" sx={sx}>{content}</Box>;
  }

  return (
    <Tooltip title={text} enterDelay={300}>
      <Box component="span" sx={{ cursor: "default", ...sx }}>
        {content}
      </Box>
    </Tooltip>
  );
}
