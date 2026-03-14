import api from "./api";

export async function fetchProjects() {
  const res = await api.get("/projects");
  return res.data;
}
export async function createProject(name: string, description: string) {
  const res = await api.post("/projects", {
    name,
    description,
  });
  return res.data;
}
export async function fetchProjectById(projectId: string) {
  const res = await api.get(`/projects/${projectId}`);
  return res.data;
}