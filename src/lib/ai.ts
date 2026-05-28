import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY is not set");
const groq = new Groq({ apiKey });

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

type Message = Groq.Chat.Completions.ChatCompletionMessageParam;

function systemPrompt(role: string): string {
  const prompts: Record<string, string> = {
    summarize: "Summarize the following notes concisely. Focus on key points and main ideas. Output in markdown.",
    quiz: "Generate 5 multiple-choice quiz questions based on the following notes. Output in markdown with format:\n\n**Question 1:** ...\n- A) ...\n- B) ...\n- C) ...\n- D) ...\n\n**Answer:** A",
    explain: "Explain the following concept simply and clearly, as if teaching someone with no background knowledge. Use examples. Output in markdown.",
    paraphrase: "Rewrite the following text to improve clarity, readability, and tone while preserving the original meaning. Output in markdown.",
  };
  return prompts[role] || prompts.summarize;
}

async function streamFromGroq(messages: Message[]): Promise<ReadableStream> {
  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });
}

export async function aiSummarizeStream(content: string): Promise<ReadableStream> {
  return streamFromGroq([
    { role: "system", content: systemPrompt("summarize") },
    { role: "user", content },
  ]);
}

export async function aiQuizStream(content: string): Promise<ReadableStream> {
  return streamFromGroq([
    { role: "system", content: systemPrompt("quiz") },
    { role: "user", content },
  ]);
}

export async function aiExplainStream(concept: string): Promise<ReadableStream> {
  return streamFromGroq([
    { role: "system", content: systemPrompt("explain") },
    { role: "user", content: concept },
  ]);
}

export async function aiParaphraseStream(text: string): Promise<ReadableStream> {
  return streamFromGroq([
    { role: "system", content: systemPrompt("paraphrase") },
    { role: "user", content: text },
  ]);
}

export async function aiAskStream(content: string, question: string): Promise<ReadableStream> {
  return streamFromGroq([
    { role: "system", content: "You are a helpful notes assistant. Answer the student's question based on the provided notes. Be concise and clear. Output in markdown." },
    { role: "user", content: `Notes:\n${content}\n\nQuestion: ${question}` },
  ]);
}

export async function aiSummarize(content: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt("summarize") },
      { role: "user", content },
    ],
  });
  return res.choices[0]?.message?.content || "";
}

export async function aiQuiz(content: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt("quiz") },
      { role: "user", content },
    ],
  });
  return res.choices[0]?.message?.content || "";
}

export async function aiExplain(concept: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt("explain") },
      { role: "user", content: concept },
    ],
  });
  return res.choices[0]?.message?.content || "";
}

export async function aiParaphrase(text: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt("paraphrase") },
      { role: "user", content: text },
    ],
  });
  return res.choices[0]?.message?.content || "";
}

export async function aiAsk(content: string, question: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a helpful notes assistant. Answer the student's question based on the provided notes. Be concise and clear. Output in markdown." },
      { role: "user", content: `Notes:\n${content}\n\nQuestion: ${question}` },
    ],
  });
  return res.choices[0]?.message?.content || "";
}
