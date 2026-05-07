# Model Strategy - SocialDrive AI

**Last Updated:** 2026-05-02

---

## Overview

Use the right model for each job. Don't over-pay for what cheaper models handle fine.

---

## Model Stack

| Model | Location | Cost | Best For |
|-------|----------|------|----------|
| **Ollama Pro** | Local (localhost:11434) | ~$0 | Bulk content generation |
| **OpenClaw (Qwen3.5 Cloud)** | Cloud via OpenClaw | Included | Web research, orchestration |
| **Claude Code** | Local setup | Claude Pro subscription | Complex builds, debugging |
| **Claude API** | API (anthropic.com) | Pay-per-token | Production features (billable) |

---

## Feature → Model Mapping

### Content Generation

| Feature | Model | Why |
|---------|-------|-----|
| Caption generation | Ollama Pro | Fast, cheap, good enough for bulk |
| Post variations (10-50 per client) | Ollama Pro | Cost-effective at scale |
| Hashtag suggestions | Ollama Pro | Simple pattern matching |
| Emoji selection | Ollama Pro | Trivial task |
| Voice note transcripts | Ollama Pro | Local, private |

### Research & Intelligence

| Feature | Model | Why |
|---------|-------|-----|
| Competitor analysis | OpenClaw (Qwen) | Has web search tools |
| Market intelligence | OpenClaw + Ollama | Research + synthesis |
| Industry trends | OpenClaw (Qwen) | Web research required |
| Brand context analysis | Ollama Pro | Local processing fine |

### Development & Integration

| Feature | Model | Why |
|---------|-------|-----|
| Building new features | Claude Code | Already setup, great at code |
| API integrations (SM, Meta, etc.) | Claude Code | Strong at API work |
| Complex debugging | Claude Code | Better reasoning |
| Code review | Claude Code | Catches edge cases |
| CSV/export logic | Claude Code | One-time builds |

### Client Communications

| Feature | Model | Why |
|---------|-------|-----|
| Email drafts | Ollama Pro | Simple, fast |
| WhatsApp messages | Ollama Pro | Short, templated |
| Client reports | Ollama + OpenClaw | Data + narrative |
| Notifications | Ollama Pro | Trivial |

### Production AI Features (Billable)

| Feature | Model | Why |
|---------|-------|-----|
| Premium caption gen | Claude API | Charge clients for quality |
| Advanced market intel | Claude API + OpenClaw | Justify premium tier |
| Custom brand voice | Claude API | Fine-tuning worth it |

---

## Cost-Saving Rules

1. **Default to Ollama** for bulk content generation
2. **Use OpenClaw** when web research is needed
3. **Escalate to Claude Code** for complex development tasks
4. **Reserve Claude API** for billable client features

---

## Configuration

### Ollama (Local)

```bash
# Check Ollama is running
ollama list

# Default model for SocialDrive AI
OLLAMA_MODEL=qwen3.5:cloud
OLLAMA_BASE_URL=http://localhost:11434
```

### OpenClaw

```bash
# Already configured in OpenClaw session
# Uses Qwen3.5 Cloud by default
```

### Claude Code

```bash
# Already setup on this machine
# Use for complex development tasks
claude
```

### Claude API (Production)

```bash
# Store in .env.local when needed
ANTHROPIC_API_KEY=sk-ant-...
```

---

## When to Switch Models

**Escalate from Ollama → Claude when:**
- Output quality is consistently poor
- Task requires complex reasoning
- Client is paying for premium tier
- Debugging critical issues

**De-escalate from Claude → Ollama when:**
- Task is repetitive/bulk (100+ items)
- Output quality is overkill for use case
- Cost becomes a concern

---

## Notes

- **Ollama Pro** = Your workhorse for 80% of tasks
- **OpenClaw** = Your research assistant with web access
- **Claude Code** = Your senior developer for hard problems
- **Claude API** = Your premium offering for paying clients

---

**Update this file when you add new models or change the strategy.**
