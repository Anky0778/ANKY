import api from "./api";

export function streamTraining(
  projectId: string,
  onEvent: (event: { step: string; message: string }) => void
): Promise<void> {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/train`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Training request failed");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    function read(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) return;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              onEvent(event);
            } catch {}
          }
        }
        return read();
      });
    }
    return read();
  });
}