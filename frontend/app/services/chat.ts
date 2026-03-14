import api from "./api";

export async function createSession(projectId: string) {
  const res = await api.post(`/projects/${projectId}/chat/sessions`);
  return res.data;
}

export async function sendMessage(
  projectId: string,
  sessionId: string,
  message: string
) {
  const res = await api.post(
    `/projects/${projectId}/chat/sessions/${sessionId}/messages`,
    { message }
  );
  return res.data;
}
