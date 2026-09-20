/* =====================================================================
   DURABLE STORE — DynamoDB, same account and region as the Lambda.

   Replaces the previous Supabase dependency, which silently disappeared
   (project host went NXDOMAIN) and took the backup copy of every lead
   with it. The requirements that drove this choice:
     · cannot be paused or reaped for inactivity
     · no shared secret to leak or rotate — IAM role only
     · schemaless, so a new lead field never needs a migration
     · effectively free at this volume (on-demand billing)

   Marshalling is hand-rolled on purpose: it depends only on
   @aws-sdk/client-dynamodb, which is always present in the Node 20 Lambda
   runtime, so there is no bundling step and nothing to go stale.
   ===================================================================== */

import { DynamoDBClient, PutItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, marshallItem, unmarshallItem } from './marshall.mjs';

const TABLE = process.env.LEADS_TABLE || 'scs-leads';
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });

/** `ym` partitions the by_month index, e.g. "2026-09". */
export function monthKey(iso) {
  return String(iso).slice(0, 7);
}

export function newId() {
  // randomUUID exists in Node 18+; avoids importing node:crypto in Lambda.
  return globalThis.crypto?.randomUUID?.() ||
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Write the lead. Returns its id. Throws — the caller decides what that means. */
export async function putLead(lead) {
  const created_at = new Date().toISOString();
  const id = newId();
  const item = { ...lead, id, created_at, ym: monthKey(created_at) };
  await ddb.send(new PutItemCommand({ TableName: TABLE, Item: marshallItem(item) }));
  return { id, created_at };
}

/** Patch delivery status once the email attempt resolves. Never throws. */
export async function setDeliveryStatus(id, status, error) {
  if (!id) return false;
  try {
    const names = { '#s': 'delivery_status' };
    const values = { ':s': marshall(status) };
    let expr = 'SET #s = :s';
    if (error) {
      names['#e'] = 'delivery_error';
      values[':e'] = marshall(String(error).slice(0, 500));
      expr += ', #e = :e';
    }
    await ddb.send(new UpdateItemCommand({
      TableName: TABLE,
      Key: { id: marshall(id) },
      UpdateExpression: expr,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
    return true;
  } catch {
    return false;
  }
}

/** How many leads has this IP sent in the last `windowMs`? Fails open (0). */
export async function countRecentByIp(ip, windowMs = 3600_000) {
  if (!ip) return 0;
  try {
    const since = new Date(Date.now() - windowMs).toISOString();
    const res = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'by_ip',
      KeyConditionExpression: 'ip = :ip AND created_at >= :since',
      ExpressionAttributeValues: { ':ip': marshall(ip), ':since': marshall(since) },
      Select: 'COUNT',
    }));
    return res.Count || 0;
  } catch {
    return 0;
  }
}

/** Leads in a given month, for the Monday digest. */
export async function leadsForMonth(ym) {
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'by_month',
    KeyConditionExpression: 'ym = :ym',
    ExpressionAttributeValues: { ':ym': marshall(ym) },
  }));
  return (res.Items || []).map(unmarshallItem);
}
