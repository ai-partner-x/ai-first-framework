// TypeScript AST node types
import * as ts from 'typescript';

// Parsed node types
export interface ParsedClass {
  name: string;
  isExported: boolean;
  heritageClauses: string[];
  decorators: ParsedDecorator[];
  fields: ParsedField[];
  methods: ParsedMethod[];
  comments: ParsedComment[];
}

export interface ParsedField {
  name: string;
  type: string;
  modifiers: string[];
  decorators: ParsedDecorator[];
  initializer?: string;
  comments: ParsedComment[];
}

export interface ParsedMethod {
  name: string;
  isAsync: boolean;
  returnType: string;
  parameters: ParsedParameter[];
  modifiers: string[];
  decorators: ParsedDecorator[];
  body: string;
  comments: ParsedComment[];
}

export interface ParsedParameter {
  name: string;
  type: string;
  modifiers: string[];
  decorators: ParsedDecorator[];
  initializer?: string;
}

export interface ParsedDecorator {
  name: string;
  arguments: string[];
}

export interface ParsedComment {
  text: string;
  isJSDoc: boolean;
}

export interface ParsedInterface {
  name: string;
  isExported: boolean;
  heritageClauses: string[];
  properties: ParsedInterfaceProperty[];
  methods: ParsedMethod[];
  decorators: ParsedDecorator[];
  comments: ParsedComment[];
}

export interface ParsedInterfaceProperty {
  name: string;
  type: string;
  isOptional: boolean;
  modifiers: string[];
  decorators: ParsedDecorator[];
  comments: ParsedComment[];
}

export interface ParsedFunction {
  name: string;
  isExported: boolean;
  isAsync: boolean;
  returnType: string;
  parameters: ParsedParameter[];
  modifiers: string[];
  decorators: ParsedDecorator[];
  body: string;
  comments: ParsedComment[];
}

export interface ParsedVariable {
  name: string;
  type: string;
  isExported: boolean;
  modifiers: string[];
  decorators: ParsedDecorator[];
  initializer: string;
  comments: ParsedComment[];
}

// Type mapping
export const TYPE_MAPPING: Record<string, string> = {
  'string': 'String',
  'number': 'int',
  'boolean': 'boolean',
  'any': 'Object',
  'void': 'void',
  'null': 'null',
  'undefined': 'void',
  'Date': 'LocalDateTime',
  'Array': 'List',
  'Map': 'Map',
  'Set': 'Set',
  'Promise': 'CompletableFuture'
};

// Import mapping for types
export const IMPORT_MAPPING: Record<string, string> = {
  'LocalDateTime': 'java.time.LocalDateTime',
  'List': 'java.util.List',
  'Map': 'java.util.Map',
  'Set': 'java.util.Set',
  'CompletableFuture': 'java.util.concurrent.CompletableFuture',
  'RedisHash': 'org.springframework.data.redis.core.RedisHash',
  'RedisRepository': 'org.springframework.data.redis.repository.RedisRepository',
  'HashKey': 'org.springframework.data.redis.core.HashKey',
  'MqListener': 'org.springframework.cloud.stream.annotation.StreamListener',
  'Output': 'org.springframework.cloud.stream.annotation.Output',
  'Input': 'org.springframework.cloud.stream.annotation.Input',
  'PreAuthorize': 'org.springframework.security.access.prepost.PreAuthorize',
  'PostAuthorize': 'org.springframework.security.access.prepost.PostAuthorize',
  'Secured': 'org.springframework.security.access.annotation.Secured',
  'Authentication': 'org.springframework.security.core.Authentication',
  'Principal': 'java.security.Principal'
};

// Decorator mapping for framework components
export const DECORATOR_MAPPING: Record<string, string> = {
  'RedisHash': 'RedisHash',
  'RedisRepository': 'RedisRepository',
  'HashKey': 'HashKey',
  'MqListener': 'StreamListener',
  'Output': 'Output',
  'Input': 'Input',
  'PreAuthorize': 'PreAuthorize',
  'PostAuthorize': 'PostAuthorize',
  'Secured': 'Secured'
};

// Transpiler options
export interface TranspilerOptions {
  packageName: string;
  classNamePrefix?: string;
  useLombok: boolean;
  javaVersion: string;
}
