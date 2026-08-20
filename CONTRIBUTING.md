# Contributing

Thanks for helping grow the map! The goal is a **curated, leveled** list of AI/ML tools — every tool sorted by concept depth, each with something to **read** and the **code**.

There are two ways to contribute.

## Option A — Suggest a tool (no code)

Open a **[Suggest a tool](../../issues/new/choose)** issue with the name, level, and the two links. That's it — a maintainer takes it from there.

## Option B — Add it yourself (a one-line PR)

Everything lives in **[`data/catalog.js`](data/catalog.js)** — one object per tool. Add yours to the right level and open a pull request.

```js
{
  name: "Tool Name",
  level: 2,                       // 0–4, by concept depth (see the table below)
  category: "Orchestration frameworks",
  note: "optional ≤4-word hint",  // omit if the name is self-explanatory
  read: {                         // 📖 the approachable resource
    url: "https://example.com/an-approachable-guide",
    title: "A Beginner's Guide to Tool Name",
    kind: "tutorial"             // tutorial | guide | docs | article
  },
  code: {                         // 🐙 the repo, or homepage if not open source
    url: "https://github.com/org/tool",
    kind: "github"               // github | homepage
  }
}
```

### The two rules

1. **Two links, chosen with care.** The **📖 Read** should be the *most approachable* real resource that explains the tool (a clear tutorial or explainer beats dense reference docs). The **🐙 Code** is the repo, or the homepage if it isn't open source.
2. **Real links only — no guessing.** Both URLs must exist and load. CI runs a link check; fabricated or dead links will fail it.

### Picking the level

| Level | Meaning |
|---|---|
| **0** | Consume ready-made GenAI — no code, no theory (e.g. ChatGPT) |
| **1** | Run & build with no/low code — GUI runners, drag-and-drop (e.g. Ollama, Flowise) |
| **2** | Code with high-level libraries — SDKs, frameworks (e.g. OpenAI SDK, LangChain) |
| **3** | Build, fine-tune & ship — RAG, agents, vector DBs, eval, serving (e.g. LangGraph, PEFT) |
| **4** | Research & scale — distributed training, inference engines, GPU kernels (e.g. vLLM, DeepSpeed) |

Level is about *concept depth* — how much you must understand to use it — not how hard it is to install.

## Before you open the PR

Requires **Node 18+** (for the built-in `fetch`). From the repo root:

```bash
npm run validate     # checks structure: required fields, valid level (0–4), https URLs, no dupes
npm run linkcheck    # checks that every Read/Code URL is live
```

Both must pass. `validate` also runs automatically on every PR and must be green before a maintainer merges.

## Style notes

- Keep `note` to ~4 words, and only when it adds clarity.
- Put the tool in the **single** best category; don't duplicate entries across levels.
- One tool per PR is easiest to review, but a small themed batch is fine too.

Not sure about placement or which Read link to use? Open the issue anyway — we'll sort it out together.
