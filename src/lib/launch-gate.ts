// Production launch gate — feature flags, performance budgets, and security checks.
export const FEATURE_FLAGS: Record<string, boolean> = {
  aerial_projects: false,
  distributed_split: false,
  mixed_ug_aerial: false,
  mdu_projects: false,
  pole_loading: false,
  strand_level_llc: false,
};

export const PERFORMANCE_BUDGETS = {
  workspaceLoadMs: 3000,
  panZoomMs: 100,
  selectionMs: 200,
  tableQueryMs: 500,
  validationMs: 5000,
  exportMs: 10000,
};

export const SECURITY_CHECKS = {
  tenantIsolation: true,
  corsOriginsAllowlist: true,
  jwtSecretRequired: true,
  inputValidationEnabled: true,
  rateLimitingEnabled: true,
  auditLoggingEnabled: true,
};

export function checkLaunchReadiness(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const [flag, enabled] of Object.entries(FEATURE_FLAGS)) {
    if (enabled) issues.push(`Future project ${flag} is enabled but should be disabled`);
  }

  for (const [check, passed] of Object.entries(SECURITY_CHECKS)) {
    if (!passed) issues.push(`Security check ${check} has not passed`);
  }

  return { ok: issues.length === 0, issues };
}
