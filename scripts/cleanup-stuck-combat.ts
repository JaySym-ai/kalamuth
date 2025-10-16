/**
 * Script to clean up stuck combat matches
 * Run with: npx tsx scripts/cleanup-stuck-combat.ts
 */

import { createServiceRoleClient } from "../utils/supabase/server";

async function cleanupStuckCombat() {
  const supabase = createServiceRoleClient();

  const matchId = "9e85d757-a0e0-4800-a285-ffa41fe48b6a";

  console.log(`Cleaning up stuck combat match: ${matchId}`);

  // Get match details
  const { data: match } = await supabase
    .from("combat_matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) {
    console.log("Match not found");
    return;
  }

  console.log(`Match status: ${match.status}`);
  console.log(`Gladiator 1: ${match.gladiator1Id}`);
  console.log(`Gladiator 2: ${match.gladiator2Id}`);

  // Update match to completed
  const { error: updateError } = await supabase
    .from("combat_matches")
    .update({
      status: "completed",
      completedAt: new Date().toISOString(),
      winnerId: match.gladiator1Id, // Arbitrary winner
      winnerMethod: "technical",
      totalActions: 5,
    })
    .eq("id", matchId);

  if (updateError) {
    console.error("Failed to update match:", updateError);
    return;
  }

  console.log("✅ Match marked as completed");

  // Remove gladiators from queue
  const { error: queueError } = await supabase
    .from("combat_queue")
    .delete()
    .in("gladiatorId", [match.gladiator1Id, match.gladiator2Id]);

  if (queueError) {
    console.error("Failed to remove from queue:", queueError);
  } else {
    console.log("✅ Gladiators removed from queue");
  }

  console.log("\nDone! You can now start a fresh combat.");
}

cleanupStuckCombat().catch(console.error);

