import { describe, it, expect } from 'vitest';
import {
  SECURITY_JAVA_MAPPING,
  getJavaMapping,
  getAllSecurityJavaMappings,
} from '../src/java-mapping.js';

describe('Java Mapping', function() {
  describe('SECURITY_JAVA_MAPPING', function() {
    it('should have mapping for @Public', function() {
      expect(SECURITY_JAVA_MAPPING['@Public']).toBe('@PermitAll');
    });

    it('should have mapping for @Authenticated', function() {
      expect(SECURITY_JAVA_MAPPING['@Authenticated']).toBe('@Authenticated');
    });

    it('should have mapping for @RolesAllowed', function() {
      expect(SECURITY_JAVA_MAPPING['@RolesAllowed']).toBe('@RolesAllowed');
    });

    it('should have mapping for @PreAuthorize', function() {
      expect(SECURITY_JAVA_MAPPING['@PreAuthorize']).toBe('@PreAuthorize');
    });

    it('should have mapping for @PostAuthorize', function() {
      expect(SECURITY_JAVA_MAPPING['@PostAuthorize']).toBe('@PostAuthorize');
    });

    it('should have mapping for @Secured', function() {
      expect(SECURITY_JAVA_MAPPING['@Secured']).toBe('@Secured');
    });

    it('should have exactly 6 mappings', function() {
      expect(Object.keys(SECURITY_JAVA_MAPPING).length).toBe(6);
    });
  });

  describe('getJavaMapping', function() {
    it('should return correct mapping for @Public', function() {
      expect(getJavaMapping('@Public')).toBe('@PermitAll');
    });

    it('should return correct mapping for @Authenticated', function() {
      expect(getJavaMapping('@Authenticated')).toBe('@Authenticated');
    });

    it('should return correct mapping for @RolesAllowed', function() {
      expect(getJavaMapping('@RolesAllowed')).toBe('@RolesAllowed');
    });

    it('should return correct mapping for @PreAuthorize', function() {
      expect(getJavaMapping('@PreAuthorize')).toBe('@PreAuthorize');
    });

    it('should return correct mapping for @PostAuthorize', function() {
      expect(getJavaMapping('@PostAuthorize')).toBe('@PostAuthorize');
    });

    it('should return correct mapping for @Secured', function() {
      expect(getJavaMapping('@Secured')).toBe('@Secured');
    });

    it('should return undefined for unknown decorator', function() {
      expect(getJavaMapping('@Unknown')).toBeUndefined();
    });

    it('should return undefined for empty string', function() {
      expect(getJavaMapping('')).toBeUndefined();
    });
  });

  describe('getAllSecurityJavaMappings', function() {
    it('should return all mappings', function() {
      const mappings = getAllSecurityJavaMappings();

      expect(mappings).toEqual(SECURITY_JAVA_MAPPING);
    });

    it('should return a copy of mappings', function() {
      const mappings1 = getAllSecurityJavaMappings();
      const mappings2 = getAllSecurityJavaMappings();

      expect(mappings1).not.toBe(mappings2);
      expect(mappings1).toEqual(mappings2);
    });

    it('should not affect original mapping when modified', function() {
      const mappings = getAllSecurityJavaMappings();
      mappings['@New'] = '@NewMapping';

      expect(SECURITY_JAVA_MAPPING['@New']).toBeUndefined();
    });
  });
});
