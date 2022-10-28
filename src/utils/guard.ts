import { JSONObject, MetadataKind } from '../models';

export function isDefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function isObject(value: unknown): value is JSONObject {
  return typeof value === 'object' && value !== null;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

export function isObjectArray(value: unknown): value is JSONObject[] {
  return Array.isArray(value) && value.every(isObject);
}

export function isStringRecord(
  value: unknown
): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).every((k) => typeof k === 'string') &&
    Object.values(value).every((v) => typeof v === 'string')
  );
}

export function isObjectRecord(
  value: unknown
): value is Record<string, JSONObject> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).every((k) => typeof k === 'string') &&
    Object.values(value).every((v) => typeof v === 'object' && v !== null)
  );
}

export function isMetadataKind(value: unknown): value is MetadataKind {
  return (
    typeof value === 'string' &&
    Object.values(MetadataKind).includes(value as MetadataKind)
  );
}
