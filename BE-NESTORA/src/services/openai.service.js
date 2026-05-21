const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chatCompletion(messages) {
  // messages: array of { role, content }
  return await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages
  });
}

module.exports = {
  chatCompletion
};
