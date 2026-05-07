import client from './client';

export const conversationApi = {
  list: (params = {}) => client.get('/conversations', { params }),
  detail: (sessionId) => client.get(`/conversations/${sessionId}`),
  handoff: (sessionId, note = '') =>
    client.post(`/conversations/${sessionId}/handoff`, { note }),
  resolve: (sessionId, note = '') =>
    client.post(`/conversations/${sessionId}/resolve`, { note }),
};

export async function listConversations(params = {}) {
  const res = await conversationApi.list(params);
  return res.data;
}

export async function getConversation(sessionId) {
  const res = await conversationApi.detail(sessionId);
  return res.data;
}

export async function markConversationHandoff(sessionId, note = '') {
  const res = await conversationApi.handoff(sessionId, note);
  return res.data;
}

export async function resolveConversation(sessionId, note = '') {
  const res = await conversationApi.resolve(sessionId, note);
  return res.data;
}

export default conversationApi;
