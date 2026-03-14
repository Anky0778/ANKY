"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProjects } from "app/services/projects";

export default function ProjectOverview() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then((projects) => {
      const found = projects.find((p: any) => p.id === projectId);
      setProject(found);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h3>Intelligence Overview</h3>

      {/* Intelligence Status Card */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h4>Intelligence Status</h4>
        <p>
          Status:{" "}
          {project.is_trained
            ? "Intelligence Ready"
            : "Not Trained"}
        </p>
        <p>Description: {project.description || "No description"}</p>

        {!project.is_trained && (
          <p style={{ color: "#b45309" }}>
            Intelligence has not been trained yet. Upload incidents and
            run training to enable semantic search.
          </p>
        )}

        {project.is_trained && (
          <p style={{ color: "#065f46" }}>
            Intelligence index built. Chat and analytics are active.
          </p>
        )}
      </div>

      {/* Usage Summary */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <h4>Workspace Summary</h4>
        <p>This workspace stores:</p>
        <ul>
          <li>Documents (Knowledge Base)</li>
          <li>Historical Incidents</li>
          <li>Vector Intelligence Index</li>
          <li>Chat Sessions & Analytics</li>
        </ul>
      </div>
    </div>
  );
}