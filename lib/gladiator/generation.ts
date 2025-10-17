import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOneGladiator } from "@/lib/generation/generateGladiator";
import { rollRarity } from "./rarity";
import type { RarityConfig } from "@/types/server";
import { serializeError, nowIso } from "@/utils/errors";
import { debug_error, debug_warn, debug_log } from "@/utils/debug";

interface GenerateGladiatorWithRetryOptions {
  client: OpenAI;
  jobId: string;
  existingNames: Set<string>;
  rarityConfig?: RarityConfig;
  retries?: number;
}

type GeneratedGladiatorData = ReturnType<typeof generateOneGladiator> extends Promise<infer T> ? T : never;

/**
 * Generate a gladiator with automatic retry logic for duplicate names
 * @returns Generated gladiator data or null if all retries failed
 */
export async function generateGladiatorWithRetry(
  options: GenerateGladiatorWithRetryOptions
): Promise<GeneratedGladiatorData | null> {
  const { client, jobId, existingNames, rarityConfig, retries = 3 } = options;
  let remainingRetries = retries;

  while (remainingRetries > 0) {
    try {
      // Roll rarity
      const rarity = rarityConfig ? rollRarity(rarityConfig) : 'common';

      // Generate gladiator
      const gladiator = await generateOneGladiator(client, {
        jobId,
        attempt: retries - remainingRetries + 1,
        existingNames: Array.from(existingNames),
        rarity
      });

      // Check for duplicate name
      const fullName = `${gladiator.name} ${gladiator.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
      if (existingNames.has(fullName)) {
        throw new Error(`Duplicate name generated: ${gladiator.name} ${gladiator.surname}`);
      }

      // Success! Add to existing names and return
      existingNames.add(fullName);
      return gladiator;
    } catch (e) {
      remainingRetries--;
      const errorMsg = serializeError(e);

      if (remainingRetries === 0) {
        debug_error(`Gladiator generation failed after ${retries} retries. Job: ${jobId}. Error: ${errorMsg}`);
      } else {
        debug_warn(`Gladiator generation retry ${retries - remainingRetries}/${retries}. Job: ${jobId}. Error: ${errorMsg}`);
      }
    }
  }

  return null;
}

interface InsertTavernGladiatorOptions {
  supabase: SupabaseClient;
  gladiator: GeneratedGladiatorData;
  userId: string;
  ludusId: string;
  serverId: string | null;
}

/**
 * Insert a generated gladiator into the tavern_gladiators table
 */
export async function insertTavernGladiator(
  options: InsertTavernGladiatorOptions
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const { supabase, gladiator, userId, ludusId, serverId } = options;
  const now = nowIso();

  const { data, error } = await supabase
    .from('tavern_gladiators')
    .insert({
      ...gladiator,
      userId,
      ludusId,
      serverId,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: serializeError(error) };
  }

  return { success: true, data };
}

/**
 * Generate and insert a tavern gladiator with retry logic
 */
export async function generateAndInsertTavernGladiator(
  options: GenerateGladiatorWithRetryOptions & Omit<InsertTavernGladiatorOptions, 'gladiator'>
): Promise<{ success: boolean; error?: string; data?: unknown; gladiator?: GeneratedGladiatorData }> {
  const gladiator = await generateGladiatorWithRetry(options);
  
  if (!gladiator) {
    return { 
      success: false, 
      error: "Failed to generate gladiator after retries" 
    };
  }

  const result = await insertTavernGladiator({
    supabase: options.supabase,
    gladiator,
    userId: options.userId,
    ludusId: options.ludusId,
    serverId: options.serverId,
  });

  if (!result.success) {
    return result;
  }

  const fullName = `${gladiator.name} ${gladiator.surname}`;
  debug_log(`Successfully generated and inserted tavern gladiator: ${fullName}`);

  return { success: true, data: result.data, gladiator };
}
