import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/firebase/request-auth";
import { adminDb } from "@/lib/firebase/server";
import InitialGladiatorsClient from "./InitialGladiatorsClient";
import { generateGladiators } from "@/lib/gladiator/generator";
import { SERVERS } from "@/data/servers";

export const runtime = "nodejs";

export default async function InitialGladiatorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getRequestUser();
  
  // Must be authenticated
  if (!user) redirect(`/${locale}/auth`);
  
  // Get user's ludus
  let ludusData: any = null;
  let gladiators: any[] = [];
  
  try {
    const ludiSnapshot = await adminDb()
      .collection("ludi")
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    
    if (ludiSnapshot.empty) {
      // No ludus found, redirect to server selection
      redirect(`/${locale}/server-selection`);
    }
    
    const ludusDoc = ludiSnapshot.docs[0];
    ludusData = { id: ludusDoc.id, ...ludusDoc.data() };
    
    // Check if gladiators already exist for this ludus
    const gladiatorsSnapshot = await adminDb()
      .collection("gladiators")
      .where("ludusId", "==", ludusDoc.id)
      .get();
    
    if (gladiatorsSnapshot.empty) {
      // Generate initial gladiators
      const server = SERVERS.find(s => s.id === ludusData.serverId);
      if (server) {
        const count = server.config.initialGladiatorsPerLudus;
        
        try {
          // Generate gladiators using AI
          const generatedGladiators = await generateGladiators(count);

          // Save gladiators to database
          const batch = adminDb().batch();

          for (const gladiator of generatedGladiators) {
            const gladiatorRef = adminDb().collection("gladiators").doc();
            batch.set(gladiatorRef, {
              ...gladiator,
              ludusId: ludusDoc.id,
              serverId: ludusData.serverId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            gladiators.push({ id: gladiatorRef.id, ...gladiator });
          }

          // Update ludus gladiator count
          batch.update(ludusDoc.ref, {
            gladiatorCount: count,
            updatedAt: new Date().toISOString(),
          });

          await batch.commit();
        } catch (error) {
          console.error("Error generating gladiators:", error);
          // Fallback: create mock gladiators for demo and save them
          const mockGladiators = createMockGladiators(count);
          const batch = adminDb().batch();

          for (const mockGladiator of mockGladiators) {
            const gladiatorRef = adminDb().collection("gladiators").doc();
            const { id: mockId, ...gladiatorWithoutId } = mockGladiator;
            const gladiatorData = {
              ...gladiatorWithoutId,
              ludusId: ludusDoc.id,
              serverId: ludusData.serverId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            batch.set(gladiatorRef, gladiatorData);
            gladiators.push({ id: gladiatorRef.id, ...gladiatorData });
          }

          // Update ludus gladiator count
          batch.update(ludusDoc.ref, {
            gladiatorCount: count,
            updatedAt: new Date().toISOString(),
          });

          await batch.commit();
        }
      }
    } else {
      // Load existing gladiators
      gladiators = gladiatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
  } catch (error) {
    console.error("Error loading gladiators:", error);
    redirect(`/${locale}/server-selection`);
  }

  const t = await getTranslations("InitialGladiators");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute inset-0 bg-[url('/arena-bg.svg')] opacity-5" />
        
        {/* Animated glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-full backdrop-blur-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 text-sm font-medium">
                {t("badge")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                {t("title")}
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t("subtitle", { ludusName: ludusData?.name || "Your Ludus" })}
            </p>
          </div>

          {/* Gladiators Display */}
          <InitialGladiatorsClient gladiators={gladiators} ludusName={ludusData?.name} />
        </div>
      </div>
    </div>
  );
}

// Mock gladiators for fallback
function createMockGladiators(count: number) {
  const mockGladiators = [];
  const names = ["Marcus", "Titus", "Gaius", "Lucius", "Quintus"];
  const surnames = ["Maximus", "Felix", "Victor", "Magnus", "Fortis"];
  
  for (let i = 0; i < count; i++) {
    mockGladiators.push({
      id: `mock-${i}`,
      name: names[i % names.length],
      surname: surnames[i % surnames.length],
      avatarUrl: "⚔️",
      health: 150,
      alive: true,
      stats: {
        strength: 50 + Math.floor(Math.random() * 30),
        agility: 50 + Math.floor(Math.random() * 30),
        dexterity: 50 + Math.floor(Math.random() * 30),
        speed: 50 + Math.floor(Math.random() * 30),
        chance: 50 + Math.floor(Math.random() * 30),
        intelligence: 50 + Math.floor(Math.random() * 30),
        charisma: 50 + Math.floor(Math.random() * 30),
        loyalty: 50 + Math.floor(Math.random() * 30),
      },
      lifeGoal: "To win glory in the arena and earn freedom",
      personality: "Brave and determined warrior",
      backstory: "A former soldier captured in battle",
      weakness: "Overconfidence in combat",
      fear: "Dying without honor",
      likes: "Fair combat and worthy opponents",
      dislikes: "Cowardice and betrayal",
      birthCity: "Rome",
      physicalCondition: "Strong and battle-ready",
      notableHistory: "Survived many battles",
    });
  }
  
  return mockGladiators;
}
