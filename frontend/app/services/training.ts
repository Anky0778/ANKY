import api from "./api";

export async function trainProject(projectId: string) {
  const res = await api.post(`/projects/${projectId}/train`);
  return res.data;
}
