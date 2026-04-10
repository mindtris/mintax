# AI Integration

mintax uses LLMs for document analysis, content generation, and job post writing. You can use cloud providers (OpenAI, Google, Mistral) or run models locally with Ollama.

## Supported Providers

- **OpenAI** — GPT-4o, GPT-4o-mini. Requires API key.
- **Google** — Gemini 2.5 Flash. Requires API key.
- **Mistral** — Mistral Medium. Requires API key.
- **Ollama / LM Studio / vLLM** — Any local GGUF model. No API key needed.

The app tries providers in order. If the first one fails or is unconfigured, it moves to the next. Configure the priority at `/settings/llm`.

## Cloud Setup

1. Get an API key from your provider (OpenAI, Google AI Studio, or Mistral Console)
2. Go to **Settings > LLM settings** in the app
3. Click the `...` menu on the provider row, select **Configure**
4. Paste your API key, set the model name, save

That provider is now active.

## Local Setup (Ollama)

Runs models entirely on your machine. No data leaves your network.

### Install

```bash
# Windows
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### Pull a model

```bash
ollama pull llama3.2
```

Models are stored at:
- **Windows** — `C:\Users\<you>\.ollama\models`
- **macOS** — `~/.ollama/models`
- **Linux** — `/usr/share/ollama/.ollama/models`

### Configure in mintax

Ollama starts an API server automatically at `http://localhost:11434/v1`.

1. Go to **Settings > LLM settings**
2. Click `...` on the **Ollama, LM Studio, vLLM, LocalAI** row
3. Set:
   - **API key** — leave empty
   - **Model** — `llama3.2` (or whatever you pulled)
   - **Base URL** — `http://localhost:11434/v1`
4. Save

The app now uses your local model.

## Prompts

Each module has its own AI prompt that controls how the LLM behaves. Manage them at **Settings > LLM settings > Prompts**.

- **Unsorted** — extracts transaction data from uploaded receipts and invoices
- **Engage** — writes social media posts and articles
- **Hire** — generates job descriptions and requirements
- **Sales** — assists with invoice descriptions and follow-ups

Default prompts are created automatically on first use. You can edit them, add alternatives, or disable them.

Each prompt can optionally override the provider and model — so you might use GPT-4o for document analysis but a local Llama model for drafting social posts.

## How It Works

```
User action (e.g. upload receipt)
  → App looks up the prompt for that module
  → Sends prompt + user input to the configured LLM provider
  → Parses structured response
  → Populates the form or displays the result
```

The AI layer lives in `lib/ai/`:
- `providers/llmProvider.ts` — provider abstraction, fallback chain
- `prompt.ts` — prompt template builder
- `schema.ts` — JSON schema generator from custom fields
- `analyze.ts` — document analysis pipeline

## Kubernetes Deployment

Run Ollama as a separate service or sidecar container:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: ollama
          image: ollama/ollama:latest
          ports:
            - containerPort: 11434
          volumeMounts:
            - name: models
              mountPath: /root/.ollama
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: ollama-models
```

Then set in the app's environment:

```
OPENAI_COMPATIBLE_BASE_URL=http://ollama.default.svc:11434/v1
OPENAI_COMPATIBLE_MODEL_NAME=llama3.2
```

For GPU inference, add resource limits and the NVIDIA device plugin to the Ollama container spec.
