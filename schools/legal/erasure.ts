/**
 * Erasing one learner, completely, and being able to prove it.
 *
 * ## The promise this pays for
 *
 * `schools/legal/documents.ts` tells a parent, in Kazakh and in Russian:
 * "Автоматты жою механизмі әлі жоқ. Деректерді жою мектептің сұрауы бойынша
 * қолмен орындалады" — there is no automatic deletion; data is erased manually
 * at the school's request. That sentence was true about the absence and
 * untrue about the presence: there was no manual path either. No script, no
 * runbook, no list of the thirty-five tables. A director who asked for a
 * child's data to be removed would have got a promise and a person guessing at
 * `delete from` statements against a live database.
 *
 * For a product used by children, an erasure path that exists only as a
 * sentence in a policy is the same as no policy.
 *
 * ## Why the erasure itself is one SQL function
 *
 * `school_forget_user` (migration 0025) is the deletion. Not a list of
 * statements in TypeScript: an operator with psql and a director on the phone
 * must be able to run the same thing this script runs, and two definitions of
 * "erase this child" is exactly the pair that drifts.
 *
 * What lives here is everything AROUND the deletion, which is the part that
 * makes it provable — resolving who is meant, refusing the case that must not
 * be automated, and scanning the schema afterwards to show nothing is left.
 *
 * The measured defect that produced 0025: `learning_forget_user` was thorough
 * about the ledger and had never touched the school side, so an erased learner
 * kept their account, their live session, their enrolment, their preferences,
 * and two identifier-keyed counters. It removed what a child DID and kept the
 * record of who they WERE.
 *
 * ## What makes it stay complete
 *
 * `TABLE_DISPOSITION` classifies every base table in the schema — erased, or
 * retained with a reason. `tests/school/erasure.test.ts` reads the live schema
 * out of `information_schema` and fails when a table appears that this file has
 * never heard of. And `residualRows` asks the SCHEMA, not the plan, what still
 * names this learner: a table the deletion missed shows up as a number rather
 * than as silence. Both misses in 0025 — `nova_usage` and `rate_limit_bucket` —
 * were subject-keyed tables with no foreign key, added later, by people
 * reasonably not thinking about deletion. That is the shape of the next one.
 *
 * ## Teachers are not erasable here, on purpose
 *
 * `curriculum_publications.reviewer_id` and `withdrawn_by` are governance
 * records: they say who approved a month of curriculum for children. Deleting a
 * teacher would either orphan those or destroy the approval trail. A teacher
 * leaving is an account to disable, which is `disabled_at` and takes effect
 * immediately. This tool refuses, and says so.
 */

/** The narrow query surface an operator script or a test can supply. */
export interface ErasureDb {
  query<T = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<{ rows: T[] }>;
}

/** Who is being erased, resolved before anything is deleted. */
export interface LearnerIdentity {
  userId: string;
  schoolId: string;
  username: string;
  displayName: string | null;
  role: string;
  /** Every subject this account has ever been bound to. Usually one. */
  subjectIds: string[];
}

/**
 * Every base table in the schema, and what erasure does with it.
 *
 * The point of writing the retained ones down is that "this table has no
 * personal data" is a claim somebody has to make on the record. The test reads
 * the live schema and fails on anything missing from here.
 */
export const TABLE_DISPOSITION: Record<string, string> = {
  /* Erased — every table the plan above touches. */
  account_preferences: "erased (user)",
  attempt_episodes: "erased (subject)",
  class_enrolments: "erased (user)",
  class_teachers: "erased (user)",
  human_reviews: "erased (subject)",
  intervention_outcomes: "erased (via interventions)",
  interventions: "erased (subject)",
  league_memberships: "erased (subject)",
  league_profiles: "erased (subject)",
  league_settlements: "erased (subject)",
  league_xp_awards: "erased (subject)",
  learner_error_dictionary: "erased (subject)",
  learner_skill_state: "erased (subject)",
  learner_state: "erased (subject)",
  learning_action_outcomes: "erased (via learning_actions)",
  learning_actions: "erased (subject)",
  learning_events: "erased (subject)",
  learning_subject_aliases: "erased (subject)",
  learning_subjects: "erased (subject)",
  learning_submissions: "erased (subject)",
  lesson_completions: "erased (subject)",
  nova_usage: "erased (subject)",
  post_help_explanations: "erased (subject)",
  rate_limit_bucket: "erased (identifier appears in the key)",
  review_schedule: "erased (subject)",
  school_accounts: "erased (user)",
  school_sessions: "erased (user)",
  school_subject_scope: "erased (subject)",

  /* Retained, each with the reason it holds nothing about one learner. */
  code_blobs:
    "content-addressed source text with no learner column. Nothing in this " +
    "product writes it — the residual scan reports any row it finds, and a " +
    "deployment that starts writing it needs a step in the plan.",
  curriculum_publications:
    "governance: which adult approved which month of curriculum. Its ids are " +
    "teachers, never learners.",
  league_groups: "a week's bracket for a class. Holds no subject id.",
  nova_spend: "monthly token totals for the whole deployment. No subject id.",
  reducer_lease: "one row naming which process holds the reducer lease.",
  schema_migrations: "which migration files have been applied.",
  school_classes: "the class itself, which outlives any learner in it.",
};

/** Look a learner up by school and username, or by user id. */
export async function findLearner(
  db: ErasureDb,
  by: { schoolId: string; username: string } | { userId: string },
): Promise<LearnerIdentity | null> {
  const account = await db.query<{
    user_id: string;
    school_id: string;
    username: string;
    display_name: string | null;
    role: string;
  }>(
    "userId" in by
      ? `select user_id, school_id, username, display_name, role
           from school_accounts where user_id = $1`
      : `select user_id, school_id, username, display_name, role
           from school_accounts where school_id = $1 and username = $2`,
    "userId" in by ? [by.userId] : [by.schoolId, by.username],
  );
  const row = account.rows[0];
  if (!row) return null;

  /* Both directions. `learning_subjects.user_id` is the binding the product
     writes; `learning_subject_aliases` under `alias_kind = 'user_id'` is how
     the imported subsystem finds a subject — see `LearningStore` — and a
     subject that lost its `user_id` column in a merge is still that child's. */
  /* The id is bound TWICE, as $1 and $2, and that is not redundancy:
     `learning_subjects.user_id` is `uuid` and `learning_subject_aliases.alias_value`
     is `text`, so one parameter used on both sides resolves to one type and the
     other comparison fails with `operator does not exist: text = uuid`. */
  const subjects = await db.query<{ subject_id: string }>(
    `select subject_id from learning_subjects where user_id = $1::uuid
     union
     select subject_id from learning_subject_aliases
      where alias_kind = 'user_id' and alias_value = $2::text`,
    [row.user_id, row.user_id],
  );

  return {
    userId: row.user_id,
    schoolId: row.school_id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    subjectIds: subjects.rows.map((s) => s.subject_id),
  };
}

export interface ErasureCount {
  table: string;
  rows: number;
}

/**
 * Erase this learner, through the database's own function.
 *
 * The caller supplies the transaction — the operator script opens one so a
 * failed residual scan can roll the whole thing back. A half-erased learner is
 * worse than an un-erased one, because nobody can tell which half.
 */
export async function eraseLearner(
  db: ErasureDb,
  identity: LearnerIdentity,
): Promise<ErasureCount[]> {
  if (identity.role !== "student") {
    throw new Error(
      `refusing to erase a ${identity.role}: publication approvals name teachers, ` +
        `and deleting one destroys the record of who approved a month of curriculum ` +
        `for children. Disable the account instead (disabled_at takes effect immediately).`,
    );
  }

  const res = await db.query<{ counts: Record<string, number> }>(
    "select school_forget_user($1) as counts",
    [identity.userId],
  );
  const counts = res.rows[0]?.counts ?? {};
  return Object.entries(counts)
    .map(([table, rows]) => ({ table, rows: Number(rows) }))
    .sort((a, b) => b.rows - a.rows || a.table.localeCompare(b.table));
}

export interface Residual {
  table: string;
  column: string;
  rows: number;
}

/**
 * What is left, asked of the SCHEMA rather than of the plan.
 *
 * This is the half that makes the erasure provable. It walks every base table
 * for a column that could name this learner — `subject_id`, `user_id`, and the
 * bucket key — and counts what still matches. A plan that missed a table shows
 * up here as a number, which is the difference between "we ran the script" and
 * "there is nothing left".
 */
export async function residualRows(
  db: ErasureDb,
  identity: LearnerIdentity,
): Promise<Residual[]> {
  const columns = await db.query<{ table_name: string; column_name: string }>(
    `select c.table_name, c.column_name
       from information_schema.columns c
       join information_schema.tables t
         on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema = 'public'
        and t.table_type = 'BASE TABLE'
        and c.column_name in ('subject_id', 'user_id', 'bucket_key')
      order by c.table_name, c.column_name`,
  );

  const out: Residual[] = [];
  for (const { table_name, column_name } of columns.rows) {
    /* Each branch binds exactly what its predicate names. Postgres rejects a
       statement given more parameters than it uses, so a shared parameter list
       would fail on the single-column tables — which is most of them. */
    const [where, params]: [string, unknown[]] =
      column_name === "bucket_key"
        ? [
            `bucket_key like '%' || $1 || '%'
               or exists (select 1 from unnest($2::text[]) s where bucket_key like '%' || s || '%')`,
            [identity.userId, identity.subjectIds],
          ]
        : column_name === "user_id"
          ? [`user_id = $1::uuid`, [identity.userId]]
          : [`subject_id = any($1::uuid[])`, [identity.subjectIds]];
    /* Identifiers are interpolated, and they come from `information_schema` —
       never from an argument. A bind parameter cannot name a table. */
    const res = await db.query<{ n: number }>(
      `select count(*)::int as n from ${table_name} where ${where}`,
      params,
    );
    const n = Number(res.rows[0]?.n ?? 0);
    if (n > 0) out.push({ table: table_name, column: column_name, rows: n });
  }

  /* Code text has no learner column at all, so it cannot be found by the walk
     above. Reported rather than deleted: in this deployment the table is empty,
     and a row in it means something started writing learner source here. */
  const blobs = await db.query<{ n: number }>("select count(*)::int as n from code_blobs");
  const blobRows = Number(blobs.rows[0]?.n ?? 0);
  if (blobRows > 0) out.push({ table: "code_blobs", column: "(content-addressed)", rows: blobRows });

  return out;
}
