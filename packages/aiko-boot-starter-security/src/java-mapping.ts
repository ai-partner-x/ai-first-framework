export const SECURITY_JAVA_MAPPING: Record<string, string> = {
  '@Public': '@PermitAll',
  '@Authenticated': '@Authenticated',
  '@RolesAllowed': '@RolesAllowed',
  '@PreAuthorize': '@PreAuthorize',
  '@PostAuthorize': '@PostAuthorize',
  '@Secured': '@Secured',
};

export function getJavaMapping(decoratorName: string): string | undefined {
  return SECURITY_JAVA_MAPPING[decoratorName];
}

export function getAllSecurityJavaMappings(): Record<string, string> {
  return { ...SECURITY_JAVA_MAPPING };
}
