export function computeCodeDiff(before: string, after: string): string {
  if (before === after) return "";

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const beforeLen = beforeLines.length;
  const afterLen = afterLines.length;

  const lcs: number[][] = Array.from({ length: beforeLen + 1 }, () =>
    Array.from({ length: afterLen + 1 }, () => 0),
  );

  for (let i = beforeLen - 1; i >= 0; i--) {
    for (let j = afterLen - 1; j >= 0; j--) {
      if (beforeLines[i] === afterLines[j]) {
        lcs[i]![j] = lcs[i + 1]![j + 1]! + 1;
      } else {
        lcs[i]![j] = Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
      }
    }
  }

  const lines: string[] = [];
  let i = 0;
  let j = 0;

  while (i < beforeLen && j < afterLen) {
    if (beforeLines[i] === afterLines[j]) {
      lines.push(` ${beforeLines[i]}`);
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      lines.push(`-${beforeLines[i]}`);
      i++;
    } else {
      lines.push(`+${afterLines[j]}`);
      j++;
    }
  }

  while (i < beforeLen) {
    lines.push(`-${beforeLines[i]}`);
    i++;
  }

  while (j < afterLen) {
    lines.push(`+${afterLines[j]}`);
    j++;
  }

  return lines.join("\n");
}
