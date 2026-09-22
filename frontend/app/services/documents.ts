import api from "./api";

export async function uploadDocuments(projectId: string, files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await api.post(
    `/projects/${projectId}/documents`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}
