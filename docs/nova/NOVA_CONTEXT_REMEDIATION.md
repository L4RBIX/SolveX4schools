# Before and after

The bug, reproduced; the fix, verified against the real model.

## The screen

September, lesson 1, block `m1.l1.b2`. A prediction:

> **Что выведет эта программа?**
> ```python
> print("2 + 2")
> ```
> `4` · `2 + 2` · `"2 + 2"`

The learner picks `"2 + 2"` — the option that thinks the quote marks are
printed. It is wrong. They open Nova and type **«Где ошибка?»**

## Before

> Языковая модель не подключена: Nova может задать вопрос, но не напишет
> объяснение.
>
> — Давай разберём вместе. Что ты уже попробовал и какого результата ждал?

Two failures, and the second is the one that matters.

The banner is honest: no `DEEPSEEK_API_KEY` was set, so `EchoProvider` answered.
That was a configuration problem, and it is fixed by adding a key.

The reply is the real defect. Even **with** a model, Nova could not have done
better, because the request carried:

```json
{ "blockId": "m1.l1.b2", "episodeId": "…", "message": "Где ошибка?",
  "requestedLevel": 1, "override": false, "locale": "ru" }
```

No selected option. No verdict. No attempt count. The server then looked the
block up in the curriculum, so Nova saw the task **as its author wrote it** —
never as the learner was experiencing it. Asking "what did you try and what did
you expect?" was the best a blind tutor could manage.

The browser was holding `{ answer, verdict, attempt }` the entire time, in the
same component that renders `<NovaChat>`.

## After

Same block, same message, same learner, against **`deepseek-v4-flash`**:

```
POLICY  granted=0 requested=1 capped=true reason=attempt_required
        provider=deepseek degraded=false

Посмотри внимательно на кавычки в строке `print("2 + 2")`.
Что именно, по-твоему, попадает внутрь кавычек?
Что ты попробуешь сделать дальше?
```

It quotes the learner's actual line, points at the exact distinction the block
is about — the quotes are syntax, what is inside them is printed — gives nothing
away, and ends by asking what they will try. At level 0, because they had not
attempted anything yet, which the policy frame states in the learner's own
language.

It did not ask them to describe their own screen.

## The second regression: debugging their own code

Task: read three numbers, print the sum. The learner writes

```python
a, b, c = input().split()
print(a + b + c)
```

and asks **«Почему выводит 123, а не 6?»**

```
Ты вводишь числа как текст, а не как числа.
Текст «1», «2» и «3» складывается в строку «123».

Чтобы получить 6, нужно превратить их в числа — например, с помощью `int()`.

Что попробуешь сделать дальше?
```

Nova has never been able to see learner code before this phase. The previous
report said so plainly: rungs 3 and 4 of the ladder are *"walk through THEIR
case"* and *"give the fix"*, and both are unsatisfiable against code nobody has
seen.

### One honest observation about that answer

The grant was **level 0** — *"ask ONE question, give nothing away"* — and the
model gave a level-2-to-3 explanation, naming `int()` as the fix.

The permissions that are mechanically enforced held: `mayIncludeCode` was
respected, no program was written, the validator passed. What is **not**
mechanically enforced is prose depth. The level is stated in the prompt and
constrained by the token budget (level 0 gets 25% of `NOVA_MAX_OUTPUT_TOKENS`,
which is why the reply is three sentences rather than twelve) — but a model that
decides to explain rather than ask is not currently stopped.

This is a real gap and it is listed as one. A prose-depth classifier is
subjective in a way the code check is not, and shipping a wrong one would refuse
good hints. The honest statement is: **the code ceiling is enforced, the
verbosity ceiling is guided.**

## What changed, mechanically

| | |
|---|---|
| `schools/nova/context.ts` | the canonical `NovaContext`, split settled / draft |
| `schools/nova/build-context.ts` | derives settled from the ledger, clamps the draft |
| `schools/nova/render-context.ts` | renders the trusted half; fences the draft |
| `schools/nova/prompt.ts` | new `TRUSTED CURRENT INTERACTION` section, grounding reminder, localized misconception |
| `src/app/api/nova/hint/route.ts` | builds the context, accepts `draft` and `history` |
| `src/components/nova/nova-chat.tsx` | sends the draft at send time, via a ref |
| `src/components/brilliant/lesson/school-lesson.tsx` | `draftFor()` — one total translation from `BlockAnswer` |

## Held by tests

- `tests/nova/current-interaction.test.ts` — 15, including this exact screen.
- `tests/nova/context-injection.test.ts` — 10, every new authored surface plus
  the whole 135-fixture corpus re-run as learner code.
- `tests/nova/personalization.test.ts` — 6, same question, four histories.
- `tests/nova/privacy-context.test.ts` — 9, whole month × 2 languages × 5 rungs.

The one that would catch a regression fastest is the first: if the question, the
code, the options, the pick, the verdict or the attempt count stops reaching the
model, it fails and names which one.
