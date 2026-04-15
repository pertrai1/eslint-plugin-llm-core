import type { RuleInstruction } from "./types";
import consistentCatchParamNameRule, {
  instruction as consistentCatchParamName,
} from "../rules/consistent-catch-param-name";
import explicitExportTypesRule, {
  instruction as explicitExportTypes,
} from "../rules/explicit-export-types";
import filenameMatchExportRule, {
  instruction as filenameMatchExport,
} from "../rules/filename-match-export";
import maxComplexityRule, {
  instruction as maxComplexity,
} from "../rules/max-complexity";
import maxFileLengthRule, {
  instruction as maxFileLength,
} from "../rules/max-file-length";
import maxFunctionLengthRule, {
  instruction as maxFunctionLength,
} from "../rules/max-function-length";
import maxNestingDepthRule, {
  instruction as maxNestingDepth,
} from "../rules/max-nesting-depth";
import maxParamsRule, { instruction as maxParams } from "../rules/max-params";
import namingConventionsRule, {
  instruction as namingConventions,
} from "../rules/naming-conventions";
import noAnyInGenericRule, {
  instruction as noAnyInGeneric,
} from "../rules/no-any-in-generic";
import noAsyncArrayCallbacksRule, {
  instruction as noAsyncArrayCallbacks,
} from "../rules/no-async-array-callbacks";
import noCommentedOutCodeRule, {
  instruction as noCommentedOutCode,
} from "../rules/no-commented-out-code";
import noEmptyCatchRule, {
  instruction as noEmptyCatch,
} from "../rules/no-empty-catch";
import noExportedFunctionExpressionsRule, {
  instruction as noExportedFunctionExpressions,
} from "../rules/no-exported-function-expressions";
import noInlineDisableRule, {
  instruction as noInlineDisable,
} from "../rules/no-inline-disable";
import noLlmArtifactsRule, {
  instruction as noLlmArtifacts,
} from "../rules/no-llm-artifacts";
import noMagicNumbersRule, {
  instruction as noMagicNumbers,
} from "../rules/no-magic-numbers";
import noRedundantLogicRule, {
  instruction as noRedundantLogic,
} from "../rules/no-redundant-logic";
import noSwallowedErrorsRule, {
  instruction as noSwallowedErrors,
} from "../rules/no-swallowed-errors";
import noTypeAssertionAnyRule, {
  instruction as noTypeAssertionAny,
} from "../rules/no-type-assertion-any";
import preferEarlyReturnRule, {
  instruction as preferEarlyReturn,
} from "../rules/prefer-early-return";
import preferUnknownInCatchRule, {
  instruction as preferUnknownInCatch,
} from "../rules/prefer-unknown-in-catch";
import structuredLoggingRule, {
  instruction as structuredLogging,
} from "../rules/structured-logging";
import throwErrorObjectsRule, {
  instruction as throwErrorObjects,
} from "../rules/throw-error-objects";

type RuleModuleWithDefaults = {
  defaultOptions?: readonly unknown[];
};

function getDefaultOptions(
  rule: RuleModuleWithDefaults,
): Record<string, unknown> {
  const [firstOption] = rule.defaultOptions ?? [];

  if (
    firstOption &&
    typeof firstOption === "object" &&
    !Array.isArray(firstOption)
  ) {
    return { ...(firstOption as Record<string, unknown>) };
  }

  return {};
}

export const ruleInstructions: Record<string, RuleInstruction> = {
  "consistent-catch-param-name": consistentCatchParamName,
  "explicit-export-types": explicitExportTypes,
  "filename-match-export": filenameMatchExport,
  "max-complexity": maxComplexity,
  "max-file-length": maxFileLength,
  "max-function-length": maxFunctionLength,
  "max-nesting-depth": maxNestingDepth,
  "max-params": maxParams,
  "naming-conventions": namingConventions,
  "no-any-in-generic": noAnyInGeneric,
  "no-async-array-callbacks": noAsyncArrayCallbacks,
  "no-commented-out-code": noCommentedOutCode,
  "no-empty-catch": noEmptyCatch,
  "no-exported-function-expressions": noExportedFunctionExpressions,
  "no-inline-disable": noInlineDisable,
  "no-llm-artifacts": noLlmArtifacts,
  "no-magic-numbers": noMagicNumbers,
  "no-redundant-logic": noRedundantLogic,
  "no-swallowed-errors": noSwallowedErrors,
  "no-type-assertion-any": noTypeAssertionAny,
  "prefer-early-return": preferEarlyReturn,
  "prefer-unknown-in-catch": preferUnknownInCatch,
  "structured-logging": structuredLogging,
  "throw-error-objects": throwErrorObjects,
};

export const ruleDefaultOptions: Record<string, Record<string, unknown>> = {
  "consistent-catch-param-name": getDefaultOptions(
    consistentCatchParamNameRule,
  ),
  "explicit-export-types": getDefaultOptions(explicitExportTypesRule),
  "filename-match-export": getDefaultOptions(filenameMatchExportRule),
  "max-complexity": getDefaultOptions(maxComplexityRule),
  "max-file-length": getDefaultOptions(maxFileLengthRule),
  "max-function-length": getDefaultOptions(maxFunctionLengthRule),
  "max-nesting-depth": getDefaultOptions(maxNestingDepthRule),
  "max-params": getDefaultOptions(maxParamsRule),
  "naming-conventions": getDefaultOptions(namingConventionsRule),
  "no-any-in-generic": getDefaultOptions(noAnyInGenericRule),
  "no-async-array-callbacks": getDefaultOptions(noAsyncArrayCallbacksRule),
  "no-commented-out-code": getDefaultOptions(noCommentedOutCodeRule),
  "no-empty-catch": getDefaultOptions(noEmptyCatchRule),
  "no-exported-function-expressions": getDefaultOptions(
    noExportedFunctionExpressionsRule,
  ),
  "no-inline-disable": getDefaultOptions(noInlineDisableRule),
  "no-llm-artifacts": getDefaultOptions(noLlmArtifactsRule),
  "no-magic-numbers": getDefaultOptions(noMagicNumbersRule),
  "no-redundant-logic": getDefaultOptions(noRedundantLogicRule),
  "no-swallowed-errors": getDefaultOptions(noSwallowedErrorsRule),
  "no-type-assertion-any": getDefaultOptions(noTypeAssertionAnyRule),
  "prefer-early-return": getDefaultOptions(preferEarlyReturnRule),
  "prefer-unknown-in-catch": getDefaultOptions(preferUnknownInCatchRule),
  "structured-logging": getDefaultOptions(structuredLoggingRule),
  "throw-error-objects": getDefaultOptions(throwErrorObjectsRule),
};
