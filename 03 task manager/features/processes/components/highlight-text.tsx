import Box from "@mui/material/Box";

interface HighlightTextProps {
  text: string;
  query: string;
}

export function HighlightText({ text, query }: HighlightTextProps) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.trim().toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + lowerQuery.length);
  const after = text.slice(index + lowerQuery.length);

  return (
    <>
      {before}
      <Box
        component="mark"
        sx={{
          bgcolor: "warning.light",
          color: "warning.contrastText",
          px: 0.25,
          borderRadius: 0.5,
        }}
      >
        {match}
      </Box>
      {after}
    </>
  );
}
