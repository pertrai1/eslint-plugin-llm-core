export function computeCodeDiff(before: string, after: string): string {
  if (before === after) return "";

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");

  const lines: string[] = [];
  const max = Math.max(beforeLines.length, afterLines.length);

  for (let i = 0; i < max; i++) {
    const bLine = beforeLines[i];
    const aLine = afterLines[i];

    if (bLine === aLine) {
      lines.push(` ${bLine}`);
    } else {
      if (bLine !== undefined) lines.push(`-${bLine}`);
      if (aLine !== undefined) lines.push(`+${aLine}`);
    }
  }

  return lines.join("\n");
}
