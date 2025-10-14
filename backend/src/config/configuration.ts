export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  scibox: {
    apiKey: process.env.SCIBOX_API_KEY,
    baseUrl: process.env.SCIBOX_BASE_URL,
    chatModel: process.env.SCIBOX_CHAT_MODEL,
    embeddingModel: process.env.SCIBOX_EMBEDDING_MODEL,
  },
});
