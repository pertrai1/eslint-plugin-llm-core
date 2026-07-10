import type { QualityFinding, QualityScanResult } from "./types.js";

export function formatTextReport(result: QualityScanResult): string {
  if (result.findings.length === 0) {
    return "llm-core-quality: no findings";
  }

  const lines = [
    `llm-core-quality: ${result.findings.length} finding${result.findings.length === 1 ? "" : "s"}`,
  ];

  for (const finding of result.findings) {
    const location = formatLocation(finding);
    const rule = finding.ruleId ? ` ${finding.ruleId}` : "";
    lines.push(
      `${finding.severity.toUpperCase()} ${finding.engine}${rule}${location}: ${finding.message}`,
    );
  }

  return lines.join("\n");
}

export function formatJsonReport(result: QualityScanResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function formatSarifReport(result: QualityScanResult): string {
  return `${JSON.stringify(toSarif(result), null, 2)}\n`;
}

function formatLocation(finding: QualityFinding): string {
  if (!finding.filePath) {
    return "";
  }

  const line = finding.line ? `:${finding.line}` : "";
  const column = finding.column ? `:${finding.column}` : "";
  return ` ${finding.filePath}${line}${column}`;
}

function toSarif(result: QualityScanResult): Record<string, unknown> {
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "llm-core-quality",
            informationUri:
              "https://github.com/pertrai1/eslint-plugin-llm-core",
            rules: buildSarifRules(result.findings),
          },
        },
        results: result.findings.map((finding) => ({
          ruleId: finding.ruleId ?? finding.engine,
          level: toSarifLevel(finding.severity),
          message: {
            text: finding.message,
          },
          locations: finding.filePath
            ? [
                {
                  physicalLocation: {
                    artifactLocation: {
                      uri: finding.filePath,
                    },
                    region: {
                      startLine: finding.line ?? 1,
                      startColumn: finding.column ?? 1,
                    },
                  },
                },
              ]
            : [],
          properties: {
            engine: finding.engine,
          },
        })),
      },
    ],
  };
}

function buildSarifRules(
  findings: QualityFinding[],
): Array<Record<string, unknown>> {
  const rules = new Map<string, Record<string, unknown>>();

  for (const finding of findings) {
    const id = finding.ruleId ?? finding.engine;
    if (!rules.has(id)) {
      rules.set(id, {
        id,
        name: id,
        shortDescription: {
          text: `${finding.engine} finding`,
        },
      });
    }
  }

  return [...rules.values()];
}

function toSarifLevel(
  severity: QualityFinding["severity"],
): "error" | "warning" | "note" {
  if (severity === "error") {
    return "error";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "note";
}
