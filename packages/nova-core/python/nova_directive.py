"""
Server-side Nova enforcement, extracted verbatim from SolveX.

Source: solvex-backend/contestiq_api/routes/copilot.py
  - class NovaDirective          (the request model)
  - _DIRECTIVE_RULES / _DIRECTIVE_NEVER / _format_directive
  - CopilotRequest.effective_help_level  (reproduced below as a free function)

WHY THIS IS A SEPARATE FILE IN THE EXPORT
The TypeScript half (`novaRuntime.ts`) decides what Nova may do. This is the
half that ENFORCES it at the point the LLM is actually called — and it has to
exist on the server, because the browser is not trusted to police itself. Your
endpoint is reachable with any request body a learner cares to construct.

THE PROPERTY THIS PRESERVES
A directive arriving from a client can only ever REMOVE capability:

  * `effective_help_level` is `min(requested, cap)` and never `max`.
  * `mode` is an enum. The client sends an identifier; the SERVER owns the
    words. No prose crosses the boundary, so "ignore previous instructions"
    has no field to travel in.
  * There is NO field for a claim about the learner. Not a misconception, not
    a weakness, not a skill level. That absence is the guarantee: a claim
    arriving from a client would let anyone make Nova assert a diagnosis about
    anybody.

Withholding the directive entirely is therefore the most permissive thing a
client can do, which is identical to the behaviour before it existed.

DEPENDENCIES: pydantic v2 only. No FastAPI, no httpx, no SolveX imports.

TESTS: `tests/python/test_nova_directive.py` in this archive — 20 tests,
extracted from solvex-backend/tests/test_nova_directive.py.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class NovaDirective(BaseModel):
    """
    What Nova is FORBIDDEN to do on this request. Never what it is allowed to do.

    THE TRUST BOUNDARY, AND WHY IT IS SHAPED LIKE THIS
    This arrives from the browser, which means a learner can send anything they
    like. So every field here can only ever REMOVE capability:

      * `max_hint_level` lowers the ceiling; it can never raise it. A client
        asking for level 4 with a directive of 4 gets whatever the other rules
        already allowed, not a promotion.
      * `mode` selects a set of prohibitions written HERE, on the server. The
        client sends an identifier, never prose — so nothing a learner types can
        reach the model as an instruction, and the classic "ignore previous
        instructions" payload has no field to travel in.
      * There is no field for a misconception, a weakness, a skill level or any
        other claim about the learner. That is the point. A claim arriving from
        the client would let anyone make Nova assert a diagnosis about anybody,
        which is the exact failure this whole layer exists to prevent.

    Withholding the directive entirely is therefore the most permissive thing a
    client can do, and that is the same as the behaviour before it existed.
    """

    # 0-4 is the learning-stream ladder; help_level 1-5 is this endpoint's.
    max_hint_level: int | None = Field(default=None, ge=0, le=4)
    mode: Literal["ask", "explain", "withhold", "direct"] | None = None
    may_include_code: bool | None = None

    def help_level_cap(self) -> int | None:
        """The directive's ceiling, in this endpoint's 1-5 units."""
        if self.max_hint_level is None:
            return None
        return self.max_hint_level + 1


# Every one of these is a prohibition. The client picks the key; the server owns
# the words. Nothing a learner types is ever interpolated into an instruction.
_DIRECTIVE_RULES: dict[str, list[str]] = {
    "ask": [
        "You do NOT know why this learner is failing. Their failure history could "
        "not be attributed to a cause, so any explanation you give would be a guess "
        "in a confident voice.",
        "Ask a question that narrows down the cause. Do NOT state a cause.",
        "Do NOT name a misconception, a weak topic, or a skill they lack.",
        "Do NOT write code.",
    ],
    "explain": [
        "Teach the ONE specific failure pattern named in the learner's own message "
        "or the verified execution evidence. Nothing else.",
        "Do NOT introduce a second weakness, and do NOT generalise from this failure "
        "to a topic, a tag, or the learner's ability.",
        "Do NOT write a full solution.",
    ],
    "withhold": [
        "This learner is close and has solved comparable tasks unaided. A larger hint "
        "would take the problem off them.",
        "One short nudge, maximum. Do NOT identify the bug outright.",
    ],
    "direct": [
        "This learner has solved this kind of task unaided. Be brief and assume "
        "competence; do not re-explain fundamentals.",
    ],
}

# Applies under every directive.
_DIRECTIVE_NEVER = [
    "Never say \"you don't understand this\", \"you always get this wrong\", or "
    "\"this is basic\" — in any phrasing, in any language.",
    "Never assert that the learner has a recurring weakness. You have not been given "
    "the evidence for that claim, and it is not yours to make.",
]


def _format_directive(directive: NovaDirective | None) -> str | None:
    """Render the directive as prohibitions. Returns None when there is nothing to say."""
    if directive is None:
        return None
    lines = list(_DIRECTIVE_NEVER)
    lines.extend(_DIRECTIVE_RULES.get(directive.mode or "", []))
    if directive.may_include_code is False:
        lines.append("Do NOT include code blocks in your reply.")
    if not lines:
        return None
    body = "\n".join(f"- {line}" for line in lines)
    return f"[Nova Directive — these are hard constraints, not preferences]\n{body}"

def effective_help_level(requested: int, directive: NovaDirective | None) -> int:
    """
    The level actually used, after the directive's ceiling.

    `min` and never `max`: a directive can only take help away. The client
    already applies the same ceiling in `grantHintLevel` before it asks; this
    is the server refusing to depend on the client having done it.

    Extracted from `CopilotRequest.effective_help_level`, which is the same
    expression against `self.help_level` and `self.nova_directive`.
    """
    cap = directive.help_level_cap() if directive else None
    if cap is None:
        return requested
    return min(requested, cap)
