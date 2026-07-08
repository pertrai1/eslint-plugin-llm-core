import type { RuleInstruction } from "./types";
import badComparisonSequenceRule, {
  instruction as badComparisonSequence,
} from "../rules/bad-comparison-sequence";
import badMinMaxFuncRule, {
  instruction as badMinMaxFunc,
} from "../rules/bad-min-max-func";
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
import missingThrowRule, {
  instruction as missingThrow,
} from "../rules/missing-throw";
import namingConventionsRule, {
  instruction as namingConventions,
} from "../rules/naming-conventions";
import noAnyInGenericRule, {
  instruction as noAnyInGeneric,
} from "../rules/no-any-in-generic";
import noAsyncArrayCallbacksRule, {
  instruction as noAsyncArrayCallbacks,
} from "../rules/no-async-array-callbacks";
import noAsyncPromiseExecutorRule, {
  instruction as noAsyncPromiseExecutor,
} from "../rules/no-async-promise-executor";
import noCommentedOutCodeRule, {
  instruction as noCommentedOutCode,
} from "../rules/no-commented-out-code";
import noDebugScaffoldingRule, {
  instruction as noDebugScaffolding,
} from "../rules/no-debug-scaffolding";
import noDynamicCodeExecutionRule, {
  instruction as noDynamicCodeExecution,
} from "../rules/no-dynamic-code-execution";
import noEmptyCatchRule, {
  instruction as noEmptyCatch,
} from "../rules/no-empty-catch";
import noExportedFunctionExpressionsRule, {
  instruction as noExportedFunctionExpressions,
} from "../rules/no-exported-function-expressions";
import noHallucinatedPackageImportsRule, {
  instruction as noHallucinatedPackageImports,
} from "../rules/no-hallucinated-package-imports";
import noInlineDisableRule, {
  instruction as noInlineDisable,
} from "../rules/no-inline-disable";
import noLlmArtifactsRule, {
  instruction as noLlmArtifacts,
} from "../rules/no-llm-artifacts";
import noMagicNumbersRule, {
  instruction as noMagicNumbers,
} from "../rules/no-magic-numbers";
import noRedundantCommentsRule, {
  instruction as noRedundantComments,
} from "../rules/no-redundant-comments";
import noRedundantLogicRule, {
  instruction as noRedundantLogic,
} from "../rules/no-redundant-logic";
import noSwallowedErrorsRule, {
  instruction as noSwallowedErrors,
} from "../rules/no-swallowed-errors";
import noTypeAssertionAnyRule, {
  instruction as noTypeAssertionAny,
} from "../rules/no-type-assertion-any";
import noUnboundedPromiseAllRule, {
  instruction as noUnboundedPromiseAll,
} from "../rules/no-unbounded-promise-all";
import noUnsafeArrayAccessRule, {
  instruction as noUnsafeArrayAccess,
} from "../rules/no-unsafe-array-access";
import noWeakRandomnessForSecretsRule, {
  instruction as noWeakRandomnessForSecrets,
} from "../rules/no-weak-randomness-for-secrets";
import preferEarlyReturnRule, {
  instruction as preferEarlyReturn,
} from "../rules/prefer-early-return";
import preferNullishCoalescingRule, {
  instruction as preferNullishCoalescing,
} from "../rules/prefer-nullish-coalescing";
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
  "bad-comparison-sequence": badComparisonSequence,
  "bad-min-max-func": badMinMaxFunc,
  "consistent-catch-param-name": consistentCatchParamName,
  "explicit-export-types": explicitExportTypes,
  "filename-match-export": filenameMatchExport,
  "max-complexity": maxComplexity,
  "max-file-length": maxFileLength,
  "max-function-length": maxFunctionLength,
  "max-nesting-depth": maxNestingDepth,
  "max-params": maxParams,
  "missing-throw": missingThrow,
  "naming-conventions": namingConventions,
  "no-any-in-generic": noAnyInGeneric,
  "no-async-array-callbacks": noAsyncArrayCallbacks,
  "no-async-promise-executor": noAsyncPromiseExecutor,
  "no-commented-out-code": noCommentedOutCode,
  "no-debug-scaffolding": noDebugScaffolding,
  "no-dynamic-code-execution": noDynamicCodeExecution,
  "no-empty-catch": noEmptyCatch,
  "no-exported-function-expressions": noExportedFunctionExpressions,
  "no-hallucinated-package-imports": noHallucinatedPackageImports,
  "no-inline-disable": noInlineDisable,
  "no-llm-artifacts": noLlmArtifacts,
  "no-magic-numbers": noMagicNumbers,
  "no-redundant-comments": noRedundantComments,
  "no-redundant-logic": noRedundantLogic,
  "no-swallowed-errors": noSwallowedErrors,
  "no-type-assertion-any": noTypeAssertionAny,
  "no-unbounded-promise-all": noUnboundedPromiseAll,
  "no-unsafe-array-access": noUnsafeArrayAccess,
  "no-weak-randomness-for-secrets": noWeakRandomnessForSecrets,
  "prefer-early-return": preferEarlyReturn,
  "prefer-nullish-coalescing": preferNullishCoalescing,
  "prefer-unknown-in-catch": preferUnknownInCatch,
  "structured-logging": structuredLogging,
  "throw-error-objects": throwErrorObjects,
};

export const ruleDefaultOptions: Record<string, Record<string, unknown>> = {
  "bad-comparison-sequence": getDefaultOptions(badComparisonSequenceRule),
  "bad-min-max-func": getDefaultOptions(badMinMaxFuncRule),
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
  "missing-throw": getDefaultOptions(missingThrowRule),
  "naming-conventions": getDefaultOptions(namingConventionsRule),
  "no-any-in-generic": getDefaultOptions(noAnyInGenericRule),
  "no-async-array-callbacks": getDefaultOptions(noAsyncArrayCallbacksRule),
  "no-async-promise-executor": getDefaultOptions(noAsyncPromiseExecutorRule),
  "no-commented-out-code": getDefaultOptions(noCommentedOutCodeRule),
  "no-debug-scaffolding": getDefaultOptions(noDebugScaffoldingRule),
  "no-dynamic-code-execution": getDefaultOptions(noDynamicCodeExecutionRule),
  "no-empty-catch": getDefaultOptions(noEmptyCatchRule),
  "no-exported-function-expressions": getDefaultOptions(
    noExportedFunctionExpressionsRule,
  ),
  "no-hallucinated-package-imports": getDefaultOptions(
    noHallucinatedPackageImportsRule,
  ),
  "no-inline-disable": getDefaultOptions(noInlineDisableRule),
  "no-llm-artifacts": getDefaultOptions(noLlmArtifactsRule),
  "no-magic-numbers": getDefaultOptions(noMagicNumbersRule),
  "no-redundant-comments": getDefaultOptions(noRedundantCommentsRule),
  "no-redundant-logic": getDefaultOptions(noRedundantLogicRule),
  "no-swallowed-errors": getDefaultOptions(noSwallowedErrorsRule),
  "no-type-assertion-any": getDefaultOptions(noTypeAssertionAnyRule),
  "no-unbounded-promise-all": getDefaultOptions(noUnboundedPromiseAllRule),
  "no-unsafe-array-access": getDefaultOptions(noUnsafeArrayAccessRule),
  "no-weak-randomness-for-secrets": getDefaultOptions(
    noWeakRandomnessForSecretsRule,
  ),
  "prefer-early-return": getDefaultOptions(preferEarlyReturnRule),
  "prefer-nullish-coalescing": getDefaultOptions(preferNullishCoalescingRule),
  "prefer-unknown-in-catch": getDefaultOptions(preferUnknownInCatchRule),
  "structured-logging": getDefaultOptions(structuredLoggingRule),
  "throw-error-objects": getDefaultOptions(throwErrorObjectsRule),
};
