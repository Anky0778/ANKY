import api from "./api";

export async function uploadIncidents(projectId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post(
    `/projects/${projectId}/incidents`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}
