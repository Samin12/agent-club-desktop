/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TProviderWithModel } from '../config/storage';

type CatalogProfile = {
  name: string;
  name_i18n?: Record<string, string>;
  description?: string;
  description_i18n?: Record<string, string>;
  source?: string;
  agent_source?: string;
};

const brandCatalogText = (text: string): string =>
  text.replace(/AionUi|AionUI/g, 'Agent Club').replace(/Aion CLI/g, 'Agent Club Agent');

/** Map system-authored display labels; preserve user content and all runtime IDs. */
export function brandBuiltinCatalogEntry<T extends CatalogProfile>(entry: T): T {
  if (!['builtin', 'internal'].includes(entry.source ?? entry.agent_source ?? '')) return entry;
  const localize = (values?: Record<string, string>) =>
    values && Object.fromEntries(Object.entries(values).map(([key, value]) => [key, brandCatalogText(value)]));
  return {
    ...entry,
    name: brandCatalogText(entry.name),
    name_i18n: localize(entry.name_i18n),
    description: entry.description && brandCatalogText(entry.description),
    description_i18n: localize(entry.description_i18n),
  };
}

export type ApiProviderWithModel = {
  provider_id: string;
  model: string;
  use_model?: string;
};

function hasCompleteModelIdentity(
  model?: TProviderWithModel
): model is TProviderWithModel & { id: string; use_model: string } {
  return Boolean(
    model &&
    typeof model.id === 'string' &&
    model.id.trim().length > 0 &&
    typeof model.use_model === 'string' &&
    model.use_model.trim().length > 0
  );
}

// ── Frontend → Backend ──────────────────────────────────────────────────

export function toApiModel(m: TProviderWithModel): ApiProviderWithModel {
  return {
    provider_id: m.id,
    model: m.use_model,
  };
}

export function toApiModelOptional(m?: TProviderWithModel): ApiProviderWithModel | undefined {
  return hasCompleteModelIdentity(m) ? toApiModel(m) : undefined;
}

/** Minimal shape of a create-conversation request consumed by the body builder. */
export type CreateConversationBodyInput = {
  type?: 'acp' | 'aionrs';
  id?: string;
  name?: string;
  model?: TProviderWithModel;
  assistant?: unknown;
  extra?: unknown;
};

/**
 * Build the HTTP body for `POST /api/conversations`.
 *
 * Top-level `model` is aionrs-only on the backend (spec 2026-05-12); other
 * agent types carry model info via `extra`.
 */
export function buildCreateConversationBody(p: CreateConversationBodyInput): Record<string, unknown> {
  const hasAssistant = p.assistant !== undefined && p.assistant !== null;
  const body: Record<string, unknown> = {
    type: hasAssistant ? undefined : p.type,
    id: p.id,
    name: p.name,
    assistant: p.assistant,
    extra: p.extra,
  };
  const model = p.type === 'acp' ? undefined : toApiModelOptional(p.model);
  if (model) body.model = model;
  return body;
}

// ── Backend → Frontend ──────────────────────────────────────────────────

export function fromApiModel(raw: ApiProviderWithModel): TProviderWithModel {
  return {
    id: raw.provider_id,
    platform: '',
    name: '',
    base_url: '',
    api_key: '',
    use_model: raw.use_model ?? raw.model,
  };
}

function fromApiModelOptional(raw?: ApiProviderWithModel | null): TProviderWithModel | undefined {
  return raw ? fromApiModel(raw) : undefined;
}

export function fromApiConversation<T>(raw: T): T {
  if (!raw || typeof raw !== 'object') return raw;

  const r = raw as T & {
    model?: ApiProviderWithModel | null;
    extra?: Record<string, unknown> | null;
  };
  const next = { ...r } as unknown as T & {
    model?: TProviderWithModel;
    extra?: Record<string, unknown> | null;
  };

  if ('model' in r) {
    next.model = fromApiModelOptional(r.model);
  }

  const extra = r.extra;
  if (extra && typeof extra === 'object' && !('custom_workspace' in extra)) {
    const workspace = typeof extra.workspace === 'string' ? extra.workspace : '';
    const isTemporary = extra.is_temporary_workspace === true;
    next.extra = {
      ...extra,
      custom_workspace: workspace.length > 0 && !isTemporary,
    };
  }

  return next;
}

export function fromApiPaginatedConversations<T>(result: { items: T[]; total: number; has_more: boolean }): {
  items: T[];
  total: number;
  has_more: boolean;
} {
  return {
    ...result,
    items: result.items.map(fromApiConversation),
  };
}
