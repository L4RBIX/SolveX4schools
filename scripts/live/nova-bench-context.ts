/** Shared by the benchmark and the sample printer, so they cannot drift. */
/**
 * The context the route would have built, without a database.
 *
 * `buildNovaContext` reads the ledger, and a benchmark does not have one. The
 * shape is the same object it returns, filled from the fixture — which is the
 * point: without it the prompt carries the task but not the learner's SCREEN,
 * so the model cannot mention the option they picked and "grounding" measures
 * a handicap this script invented rather than anything about temperature.
 */
export function contextFor(c: {
  locale: "ru" | "kk"; prompt: string; code?: string; picked?: string; stderr?: string; level: number;
}): unknown {
  return {
    learner: { subjectId: "bench", locale: c.locale },
    curriculum: {
      monthTitle: c.locale === "kk" ? "Қыркүйек" : "Сентябрь",
      lessonTitle: c.locale === "kk" ? "Алғашқы қадамдар" : "Первые шаги",
      blockId: "bench.b1",
      blockType: c.picked ? "prediction" : "write_code",
      prompt: c.prompt,
      skillIds: [],
      capability: null,
      mode: "lesson",
    },
    interaction: {
      visible: {
        code: c.code,
        options: c.picked ? [{ id: c.picked, text: c.picked }] : undefined,
      },
      settled: {
        verdict: c.picked ? "incorrect" : c.stderr ? "incorrect" : "unchecked",
        attemptCount: c.picked || c.stderr ? 1 : 0,
        deliveredHintLevel: -1,
        attemptSinceLastHelp: true,
        stderr: c.stderr || undefined,
      },
      draft: c.picked
        ? { selectedOptionId: c.picked }
        : c.code
          ? { code: c.code }
          : undefined,
    },
    intelligence: { relevantSkills: [], recentEvidence: [], action: null, directive: null, directiveNote: null },
    assistance: {
      grant: {
        requested: c.level, granted: c.level, capped: false,
        reason: "granted_as_requested", explanation: null,
        mayIncludeCode: c.level >= 3, mustNotSay: [],
      },
      assessmentCapped: false,
    },
  };
}



/** Letters Kazakh has and Russian does not. */
const KK_ONLY = /[әғқңөұүһі]/i;
