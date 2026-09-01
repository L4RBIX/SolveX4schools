/**
 * Verbatim figures from the approved programme document.
 *
 * Source: `9-сынып_спорттық_бағдарламалау_үйірмесі (1).pdf`, 12 pages,
 * dated Тамыз 2026. Every constant below carries the page it came from.
 *
 * This file exists so that the programme's own numbers live in exactly one
 * place. If the school issues a revised PDF, this is what changes, and the
 * validator will report every entity that no longer agrees with it.
 *
 * Nothing here is rounded, averaged or "cleaned up". Where the document says
 * "шамамен" (approximately), the value is marked approximate rather than
 * silently presented as exact.
 */

export const PROGRAMME_SOURCE = {
  file: "9-сынып_спорттық_бағдарламалау_үйірмесі (1).pdf",
  pages: 12,
  issued: "Тамыз 2026",
  titleKk: "9-сыныпқа арналған спорттық бағдарламалау үйірмесі",
  subtitleKk:
    "Тоғыз айлық оқу бағдарламасы және оқушы мен мұғалімге арналған жеке онлайн-платформа",
} as const;

/** PDF p.2, §1 — the parameter table. */
export const PROGRAMME_FACTS = {
  /** "9-сынып оқушылары, 14-15 жас, нөлден бастайды" */
  grade: 9,
  ageRange: "14–15",
  priorExperienceRequired: false,

  /** "Оқу жылы, қыркүйектен мамырға дейін, шамамен 36 апта" */
  weeks: { value: 36, approximate: true },

  /** "Аптасына екі онлайн-сабақ, әрқайсысы 45 минут. Жыл бойы 72 сабақ, шамамен 54 сағат" */
  sessionsPerWeek: 2,
  sessionMinutes: 45,
  totalSessions: 72,
  totalSessionHours: { value: 54, approximate: true },

  /** "Аптасына кемінде шамамен 40 минут" — a floor, not a target. */
  platformMinutesPerWeek: { value: 40, approximate: true, isMinimum: true },

  /** "Жылына кемінде шамамен 78 сағат" */
  totalLearningHours: { value: 78, approximate: true, isMinimum: true },

  /** "70 пайыз практика, 30 пайыз түсіндіру" */
  practiceRatio: 0.7,
  theoryRatio: 0.3,
} as const;

/** PDF p.5, §3 — how the 70/30 split lands in real time. */
export const TIME_BUDGET = {
  year: { theoryHours: 23, practiceHours: 55, approximate: true },
  month: { theoryHours: 2.5, practiceHours: 6, approximate: true },
  /** Within a single 45-minute session. */
  session: { theoryMinutes: 15, practiceMinutes: 30 },

  /**
   * The document's own arithmetic, reproduced so it can be checked:
   * 72 sessions × 45 min ≈ 54 h, of which 18 h theory and 36 h practice.
   * Plus the platform minimum: ~40 min/week ≈ 24 h/year, of which ~5 h short
   * explanation lessons and ~19 h problem solving.
   */
  derivation: {
    sessionTheoryHours: 18,
    sessionPracticeHours: 36,
    platformHoursPerYear: 24,
    platformExplanationHours: 5,
    platformSolvingHours: 19,
  },
} as const;

/**
 * PDF p.11, §5 — the year summary table's final row.
 *
 * "Шамамен 250 оқу тапсырмасы, оның ішінде шамамен 100 толық дербес шешім.
 *  Бұл минимум жиын; платформада қосымша есептер бар және белсенді оқушы
 *  бұдан көбірек шығарады."
 *
 * Note the qualifier: this is a **minimum**, and the per-month counts sum to
 * 254, not 250. Both figures are the document's; neither is wrong. The
 * validator compares implementation against the per-month numbers.
 */
export const TASK_TARGETS = {
  totalTasks: { value: 250, approximate: true, isMinimum: true },
  fullyIndependentSolutions: { value: 100, approximate: true, isMinimum: true },
  /**
   * Sum of the per-month figures §4 actually states — EIGHT of them.
   *
   * May is described by its format ("төрт 45 минуттық жаттығу жарысы… бес
   * бейтаныс есептен тұратын қорытынды турнир") and carries no task count, so
   * 254 is 36+38+34+32+30+30+26+28. `month-09-may.ts` derives its own 25 from
   * that description and says so. Calling this "the nine figures" was wrong and
   * would have had a later reader hunting for a ninth number the PDF never
   * printed.
   */
  sumOfMonthlyCounts: 254,
} as const;

/** PDF p.2, §1 — "Жыл соңында оқушы не істей алады", all nine, in order. */
export const YEAR_END_OUTCOMES_KK: readonly string[] = [
  "Есеп шартын оқып, не берілгенін және нені табу керегін ажыратады.",
  "Кодқа отырмас бұрын шешу жоспарын құрып, оны сөзбен айтып бере алады.",
  "Бөтен шешімді көшірмей, бағдарламаны өз бетінше жазады.",
  "Бағдарламаны компьютер сияқты қадам-қадаммен қағазда тексереді.",
  "Өз қатесін тауып, себебін түсініп түзетеді.",
  "Қалыптан тыс жағдайларды қоса алып, өзінің тексеру мысалдарын құрастырады.",
  "Бағдарламаның берілген уақытқа үлгеретінін бағалайды және қажет болса жылдамдатады.",
  "Мектепішілік бағдарламалау жарыстарына қатысады және олардың қалай өтетінін біледі.",
  "Шешімінің неге дұрыс екенін ауызша дәлелдейді.",
] as const;

/**
 * PDF p.4, §2 — the AI rules. These are product constraints, not aspirations,
 * and several map directly onto the Nova hint ladder.
 */
export const AI_RULES_KK: readonly string[] = [
  "Көмек оқушы өзі бір әрекет жасап көргеннен кейін ғана ашылады.",
  "Көмек ишарадан түсіндіруге қарай кезеңмен беріледі және ешқашан дайын кодтан басталмайды.",
  "Кез келген көмектен соң оқушы шешімді өз сөзімен түсіндіруге, ал бірнеше күннен кейін сол есепті көмексіз қайта шешуге міндетті.",
  "Оқушы әрдайым онымен адам емес, бағдарлама сөйлесіп тұрғанын біліп отырады.",
  "Оқушы көмекке тым жиі сүйенсе, мұғалімге белгі барады.",
] as const;

/**
 * PDF p.6 — the five independent checks used to establish real understanding.
 * "Жұмыс істеген бағдарлама әлі түсінудің дәлелі емес" — a program that runs is
 * not yet proof of understanding.
 */
export const VERIFICATION_METHODS_KK: readonly {
  key: string;
  title: string;
  description: string;
}[] = [
  {
    key: "unseen_problem",
    title: "Бейтаныс есептер",
    description:
      "Ешбір сабақта талданбаған есептер. Олар оқушының үлгіні қайталап тұрғанын әлде шынымен ойлап тұрғанын көрсетеді.",
  },
  {
    key: "manual_trace",
    title: "Кодты қолмен орындау",
    description:
      "Оқушы бағдарламаны қағазда қадамдап жүргізіп, іске қоспай-ақ нәтижесін айтады.",
  },
  {
    key: "find_bug",
    title: "Қатені табу",
    description:
      "Оқушыға істемейтін бағдарлама беріледі, ол себебін тауып түзетуі керек.",
  },
  {
    key: "oral_explanation",
    title: "Ауызша түсіндіру",
    description:
      "Шешімінің неге дұрыс екенін және шарт өзгерсе не бұзылатынын түсіндіреді.",
  },
  {
    key: "delayed_resolve",
    title: "Уақыт өте қайта шешу",
    description:
      "Көмекпен шешілген есеп бірнеше аптадан соң қайта беріледі және бұл жолы көмексіз орындалады.",
  },
] as const;

/** PDF p.6, §3 — what each differentiation level actually changes. */
export const TRACK_DEFINITIONS_KK = {
  support: {
    title: "Қолдау",
    description:
      "Тек негізгі есептер; дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ. Көмек ертерек ашылады, мұғалімнен қосымша қолдау беріледі.",
  },
  core: {
    title: "Негізгі",
    description: "Айдың толық тапсырма жиыны және қалауы бойынша 1-2 күрделірек есеп.",
  },
  advanced: {
    title: "Тереңдетілген",
    description:
      "Негізгі есептерді жедел қарқынмен өтіп, күрделі есептер блогына көш. Көмек кешірек ашылады, шешімді жазбаша қорғау міндетті.",
  },
} as const;

/**
 * PDF p.5 — the weekly rhythm. This is what the product has to make possible,
 * not something the platform replaces.
 */
export const WEEK_STRUCTURE_KK = [
  {
    phase: "1-сабақ (45 минут)",
    detail:
      "Мұғалім дайын мысалды ойлау барысын дауыстап айта отырып талдайды, содан кейін оқушылар оның бақылауымен есеп шығарады.",
  },
  {
    phase: "Сабақтардың арасында",
    detail:
      "Платформада кемінде шамамен 40 минут жаттығу. Уақытын оқушы өзі таңдайды, тапсырма күрделілігі деңгейге қарай бейімделеді.",
  },
  {
    phase: "2-сабақ (45 минут)",
    detail:
      "2-3 есептен тұратын шағын жарыс, одан кейін ортақ талдау және қателермен жұмыс. Бірнеше оқушы шешімін ауызша түсіндіреді.",
  },
] as const;

/**
 * PDF p.4 — data protection commitments. Recorded here because several are
 * engineering constraints, not policy prose: KZ-resident storage, minimal
 * fields, no biometrics, revocable consent with deletion.
 */
export const DATA_COMMITMENTS_KK: readonly string[] = [
  "Деректерді жинау ата-ананың немесе заңды өкілдің жазбаша келісімінен кейін ғана басталады.",
  "Тек ең қажеттісі жиналады: аты-жөні, сыныбы, оқу прогресі. Биометрия алынбайды, жасырын жазба жүргізілмейді.",
  "Оқушылардың деректері Қазақстан Республикасының дербес деректер туралы заңына сәйкес ел аумағындағы серверлерде сақталады.",
  "Ата-ана келісімін кез келген уақытта кері қайтара алады, содан соң баланың деректері жойылады.",
  "Мектеп өз оқушыларының нәтижелерін көреді және жүктеп ала алады.",
] as const;

/**
 * Year 1 teaches GNU C++17.
 *
 * ## This is a change to the programme, not to the code
 *
 * It said `"python"`, and it said so with a citation: the programme's own
 * examples are Python throughout (`if / elif / else`, `for`/`while`, lists,
 * `return`). That citation is still true of the PDF. The release owner has
 * decided the year is taught in C++ instead — the course is
 * «Спортивное программирование», and C++ is the language of the contests it
 * prepares for.
 *
 * So this constant is now ahead of the document it was traced from. That is
 * stated here rather than hidden, because the whole point of this file is that
 * the code cannot quietly disagree with the programme:
 *
 *   - the PDF still shows Python examples and needs revising;
 *   - `curriculum-owner sign-off` is NOT satisfied by this edit and stays open;
 *   - `docs/curriculum/CURRICULUM_TRACEABILITY.md` row 1.1 and the language
 *     rows must be re-derived against the revised document, not against this
 *     constant.
 *
 * ## What did NOT change
 *
 * p.7's "ООР-ке дейінгі процедуралық бағдарламалау" — procedural programming up
 * to but not including OOP — is a pedagogical bound, not a language one, and it
 * survives the move. Year 1 C++ is `int main()`, `cin`/`cout`, `vector`,
 * `string`, free functions and recursion. No classes, no templates of the
 * learner's own, no inheritance, no move semantics.
 *
 * The audience is unchanged and is the reason that bound matters:
 * `PROGRAMME_FACTS.priorExperienceRequired` is `false` — 14–15 year olds,
 * «нөлден бастайды», from zero.
 */
export const YEAR_ONE_LANGUAGE = "cpp17" as const;
export const YEAR_ONE_EXCLUDES_OOP = true;

/**
 * What the learner sees the language called, and what the judge must be asked
 * for. Kept beside the decision so a UI label and a Judge0 lookup cannot drift
 * apart from the programme.
 */
export const YEAR_ONE_LANGUAGE_LABEL = "C++17" as const;
export const YEAR_ONE_LANGUAGE_STANDARD = "c++17" as const;

/**
 * WHICH CURRICULUM a learner's evidence belongs to.
 *
 * ## The defect this exists to make impossible
 *
 * Python block `m1.as.b1` and C++ block `m1.as.b1` share a logical id. Every
 * progression query was `subject_id + block_id`, so an accepted Python-era
 * verdict on `m1.as.b1` satisfied the C++ independence requirement for the same
 * month — a learner could be credited for demonstrating in C++ something they
 * only ever did in Python, and the next month would unlock.
 *
 * It had not materialised (production holds zero accepted independence blocks),
 * but "currently zero" is a fact about today's data, not an architecture.
 *
 * ## Why this is not `language`
 *
 * `YEAR_ONE_LANGUAGE` says what the learner writes. This says which BODY OF
 * CONTENT their evidence was earned against, and the two are not the same
 * question: a future C++ revision that re-authors half the assessments is still
 * `cpp17`, and evidence from the old revision should not automatically satisfy
 * the new one. Overloading `language` would make that impossible to express, so
 * the version carries its own dimension and the language stays alongside it.
 *
 * ## How the isolation works
 *
 * The version scopes the SUBJECT, not each evidence row. One subject per
 * (account, curriculum version) means a C++ subject id has no Python rows
 * anywhere — so every existing `where subject_id = $1` is correct by
 * construction, and a future query cannot leak by forgetting a predicate,
 * because there is no predicate to forget. See migration 0024.
 */
export const CURRICULUM_VERSION = "cpp17-year1-v1" as const;

/**
 * The version every pre-versioning row is backfilled to.
 *
 * Read the migration's comment before assuming this means "was written in
 * Python": it is the FAIL-CLOSED bucket for all evidence that predates
 * versioning, which includes rows created while acceptance-testing C++ against
 * the production database. Quarantining those from C++ progression is the
 * correct outcome — they are test data — but they were not Python.
 */
export const LEGACY_CURRICULUM_VERSION = "python-year1-v1" as const;

/** Shape of a curriculum version id, enforced at the database boundary too. */
export type CurriculumVersion = typeof CURRICULUM_VERSION | typeof LEGACY_CURRICULUM_VERSION;
