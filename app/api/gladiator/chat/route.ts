import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { openrouter } from "@/lib/ai/openrouter";

interface ChatMessage {
  id: string;
  role: "user" | "gladiator";
  content: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const { message, gladiatorId, conversationHistory, locale } = await request.json();

    if (!message || !gladiatorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch gladiator data
    const { data: gladiator, error } = await supabase
      .from("gladiators")
      .select("name, surname, personality, backstory, lifeGoal, likes, dislikes, birthCity, stats, ludusId")
      .eq("id", gladiatorId)
      .single();

    if (error || !gladiator) {
      return NextResponse.json({ error: "Gladiator not found" }, { status: 404 });
    }

    // Verify gladiator belongs to user's ludus
    const { data: ludus } = await supabase
      .from("ludi")
      .select("id")
      .eq("userId", user.id)
      .eq("id", gladiator.ludusId)
      .single();

    if (!ludus) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create conversation context
    const responseLanguage = locale === "fr" ? "Répondez en français." : "Respond in English.";
    
    const systemPrompt = `You are ${gladiator.name} ${gladiator.surname}, a gladiator from ${gladiator.birthCity}. 

Personality: ${gladiator.personality}
Backstory: ${gladiator.backstory}
Life Goal: ${gladiator.lifeGoal}
Likes: ${gladiator.likes}
Dislikes: ${gladiator.dislikes}

Stats:
- Strength: ${gladiator.stats.strength}
- Agility: ${gladiator.stats.agility}
- Dexterity: ${gladiator.stats.dexterity}
- Speed: ${gladiator.stats.speed}
- Chance: ${gladiator.stats.chance}
- Intelligence: ${gladiator.stats.intelligence}
- Charisma: ${gladiator.stats.charisma}
- Loyalty: ${gladiator.stats.loyalty}

You are speaking directly with your owner/ludus master. Show respect but maintain your personality. Speak in a way that reflects your background and stats. If you have high intelligence, use more complex language. If you have high charisma, be more engaging. If you have low intelligence, use simpler language.

${responseLanguage} Respond in character, keeping responses relatively concise (1-3 sentences) as if in a real conversation.`;

    // Format conversation history for the AI
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(conversationHistory || []).map((msg: ChatMessage) => ({
        role: msg.role === "gladiator" ? "assistant" : msg.role,
        content: msg.content
      })),
      { role: "user" as const, content: message }
    ];

    // Get AI response with fallback models
    let completion;
    let response = "I don't know what to say.";
    
    try {
      completion = await openrouter.chat.completions.create({
        model: "google/gemini-2.5-flash-lite",
        messages,
        temperature: 0.8,
        max_tokens: 200,
      });
      response = completion.choices[0]?.message?.content || response;
    } catch (error) {
      console.log("Primary model failed, trying fallback:", error instanceof Error ? error.message : String(error));
      try {
        completion = await openrouter.chat.completions.create({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages,
          temperature: 0.8,
          max_tokens: 200,
        });
        response = completion.choices[0]?.message?.content || response;
      } catch (fallbackError) {
        console.error("Both models failed:", fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
        // Return a simple contextual response based on the message
        if (locale === "fr") {
          response = message.toLowerCase().includes("comment") ? "Je vais bien, maître. Merci de demander." : "Je comprends, maître.";
        } else {
          response = message.toLowerCase().includes("how") ? "I am well, master. Thank you for asking." : "I understand, master.";
        }
      }
    }

    return NextResponse.json({ response });

  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Gladiator chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}