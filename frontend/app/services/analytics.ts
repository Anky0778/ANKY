import api from "./api";

export async function fetchAnalytics(projectId: string) {
  const res = await api.get(`/projects/${projectId}/analytics`);
  return res.data;
}
