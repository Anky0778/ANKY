def extract_section(text: str, header: str) -> str | None:
    if header not in text:
        return None
    return text.split(header, 1)[1].strip().split("\n\n")[0]


def build_conversation_state(messages: list[dict]) -> str:
    """
    Builds a compact reasoning memory from prior chat turns.
    """

    state = {
        "current_hypothesis": None,
        "confirmed_facts": [],
        "open_questions": [],
    }

    for m in messages:
        if m["role"] == "assistant":
            text = m["content"]

            rc = extract_section(text, "Probable Root Cause:")
            if rc:
                state["current_hypothesis"] = rc

            q = extract_section(text, "Optional Clarifying Question:")
            if q and q.lower() != "none":
                state["open_questions"].append(q)

        if m["role"] == "user":
            state["confirmed_facts"].append(m["content"])

    return f"""
ACTIVE INCIDENT CONTEXT (AUTHORITATIVE):
- Current working hypothesis (do NOT reset unless contradicted):
  {state['current_hypothesis']}

- Confirmed facts from the user so far:
  {state['confirmed_facts']}

- Open clarification questions awaiting answers:
  {state['open_questions']}
"""
