from pydantic import BaseModel

class ProjectAnalyticsResponse(BaseModel):
    incident_count: int
    chat_sessions_count: int
    message_count: int
    ai_calls: int
    chat_usage_per_incident: float
