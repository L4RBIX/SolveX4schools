# Privacy and Terms — what a lawyer still has to confirm

**Status: DRAFT. LEGAL REVIEW REQUIRED.** Nothing in `/privacy` or `/terms` has
been reviewed by a lawyer, and neither page claims it has.

The text in `schools/legal/documents.ts` was written by reading the application,
not from a template. That makes it accurate about behaviour and says nothing
about whether it is *sufficient* under Kazakh law, which is a different question
and not one this repository can answer.

## Written from verified behaviour

Each of these was checked in the source before the corresponding claim was
written. They should stay true, and a test asserts the ones that are mechanical.

| Claim on the page | Verified in |
| --- | --- |
| No email is collected | `database/migrations/0012_school_identity.sql` — `school_accounts` has no email column |
| Passwords are scrypt-hashed, never stored in the clear | `schools/auth/password.ts` |
| Session tokens are stored as sha256, not in the clear | `schools/auth/session.ts` |
| Sessions expire after 8 hours | `SESSION_TTL_SECONDS` |
| Teacher access comes from the class list, not the role | `schools/auth/guard.ts` — `requireClassAccess` |
| A learner's data is resolved from the session, not a URL parameter | `requireLearner` |
| Nova receives only the current block, the learner's own answer and their own recent attempts | `schools/nova/prompt.ts` |
| The model request leaves the server, never the browser | `schools/nova/providers/deepseek.ts` carries `server-only` |
| Code execution is not wired to a third party in this build | `schools/exec/index.ts` |
| Disabling an account takes effect immediately | `currentUser()` returns null for `disabledAt` |

## Needs a human decision — these are gaps, not wording

1. **Controller / processor.** The page says the school is the controller and
   SolveX processes on its behalf. That is the ordinary arrangement for a school
   product and it needs to match the signed contract. If no data-processing
   agreement exists, this sentence is describing a document that does not exist.

2. **Minors and parental consent.** Learners are 14–15. The page says consent
   runs through the school's own process. Whether that satisfies Kazakh law on
   processing minors' data — and what the school must show parents — is a legal
   question this text assumes an answer to.

3. **Retention.** There is **no automated deletion job**. The page says so
   plainly rather than inventing a window. A real retention period has to be
   agreed with the school and then actually implemented; until it is, do not
   change the wording to imply otherwise.

   The MANUAL path the page promises now exists and is proven:
   `scripts/erase-learner.ts`, `docs/operations/ERASURE.md`, and
   `tests/school/erasure.test.ts`. It removes the account, its sessions,
   enrolment, preferences and the whole learning ledger in one transaction, and
   refuses to commit if the schema still names the learner. Before 2026-09 the
   sentence was true about the absence of a job and false about the presence of
   a path.

4. **Cross-border transfer.** Nova's provider is DeepSeek when configured, which
   means prompt content leaves the country. The page discloses what is sent and
   what is not. Whether that transfer is permitted, and on what basis, is
   unresolved. **This is the single item most likely to matter to a director.**

5. **Data subject requests.** The page routes requests through the school, and
   an operator can now act on one — see item 3. There is still no SELF-SERVICE
   export or deletion in the product: a learner cannot erase themselves, and the
   export function (`learning_export_user`) returns events only, not the account.
   If the law requires a direct channel, one has to be built, not just described.

6. **Named legal entity and address.** Both documents refer to
   "SolveX4Schools" with no registered entity, address or contact. A real
   published policy needs those.

7. **Governing law and dispute resolution.** The Terms name neither. Deliberate:
   guessing a jurisdiction is worse than leaving the gap visible.

8. **Incident notification.** No breach-notification commitment is made, because
   no incident process exists yet.

## Rule for whoever edits these next

Do not add a claim to `schools/legal/documents.ts` unless you can point at the
code that makes it true. If a reviewer asks for a sentence the product does not
support, the fix is to build the behaviour or to keep the sentence out — a
privacy page is read by a director and repeated to parents.
