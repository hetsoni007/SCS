/* =====================================================================
   DynamoDB AttributeValue marshalling — pure, dependency-free.
   Split from store.mjs so it can be unit-tested without the AWS SDK.
   ===================================================================== */

/** Minimal DynamoDB AttributeValue marshaller for the types we store. */
export function marshall(value) {
  if (value === null || value === undefined || value === '') return { NULL: true };
  if (typeof value === 'string') return { S: value };
  if (typeof value === 'number') return Number.isFinite(value) ? { N: String(value) } : { NULL: true };
  if (typeof value === 'boolean') return { BOOL: value };
  if (Array.isArray(value)) {
    return value.length ? { L: value.map(marshall) } : { NULL: true };
  }
  if (typeof value === 'object') {
    const m = {};
    for (const [k, v] of Object.entries(value)) m[k] = marshall(v);
    return { M: m };
  }
  return { S: String(value) };
}

export function marshallItem(obj) {
  const item = {};
  for (const [k, v] of Object.entries(obj)) item[k] = marshall(v);
  return item;
}

export function unmarshall(av) {
  if (!av || typeof av !== 'object') return null;
  if ('NULL' in av) return null;
  if ('S' in av) return av.S;
  if ('N' in av) return Number(av.N);
  if ('BOOL' in av) return av.BOOL;
  if ('L' in av) return av.L.map(unmarshall);
  if ('M' in av) {
    const o = {};
    for (const [k, v] of Object.entries(av.M)) o[k] = unmarshall(v);
    return o;
  }
  return null;
}

export function unmarshallItem(item) {
  const o = {};
  for (const [k, v] of Object.entries(item || {})) o[k] = unmarshall(v);
  return o;
}
