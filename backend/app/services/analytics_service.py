from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.models.analytics import AnalyticsEvent
from app.models.incident import Incident
from app.models.chat import ChatSession, ChatMessage
from datetime import datetime, timedelta


def record_event(db: Session, project_id, event_type: str, event_metadata: dict | None = None):
    event = AnalyticsEvent(
        project_id=project_id,
        event_type=event_type,
        event_metadata=event_metadata
    )
    db.add(event)
    db.commit()


def get_project_analytics(db: Session, project_id):
    incident_count = (
        db.query(Incident)
        .filter(Incident.project_id == project_id)
        .count()
    )
    chat_sessions_count = (
        db.query(ChatSession)
        .filter(ChatSession.project_id == project_id)
        .count()
    )
    message_count = (
        db.query(ChatMessage)
        .join(ChatSession)
        .filter(ChatSession.project_id == project_id)
        .count()
    )
    ai_calls = (
        db.query(AnalyticsEvent)
        .filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.event_type == "ai_call"
        )
        .count()
    )
    chat_usage_per_incident = (
        message_count / incident_count if incident_count > 0 else 0.0
    )
    return {
        "incident_count": incident_count,
        "chat_sessions_count": chat_sessions_count,
        "message_count": message_count,
        "ai_calls": ai_calls,
        "chat_usage_per_incident": round(chat_usage_per_incident, 2),
    }


def get_project_trend(db: Session, project_id):
    """
    Returns last 8 weeks of chat sessions and AI calls grouped by week.
    Incident model has no created_at so total incidents is returned as a scalar.
    """
    today = datetime.utcnow().date()

    # Build 8 weekly buckets: week_start (inclusive) → week_end (exclusive)
    weeks = []
    for i in range(7, -1, -1):
        week_start = today - timedelta(weeks=i)
        week_end   = today - timedelta(weeks=i - 1)
        weeks.append((week_start, week_end))

    earliest = weeks[0][0]

    # --- Chat sessions per day ---
    session_rows = (
        db.query(
            cast(ChatSession.created_at, Date).label("day"),
            func.count(ChatSession.id).label("cnt")
        )
        .filter(
            ChatSession.project_id == project_id,
            ChatSession.created_at >= earliest
        )
        .group_by(cast(ChatSession.created_at, Date))
        .all()
    )
    session_by_day = {str(r.day): r.cnt for r in session_rows}

    # --- AI calls per day ---
    ai_rows = (
        db.query(
            cast(AnalyticsEvent.created_at, Date).label("day"),
            func.count(AnalyticsEvent.id).label("cnt")
        )
        .filter(
            AnalyticsEvent.project_id == project_id,
            AnalyticsEvent.event_type == "ai_call",
            AnalyticsEvent.created_at >= earliest
        )
        .group_by(cast(AnalyticsEvent.created_at, Date))
        .all()
    )
    ai_by_day = {str(r.day): r.cnt for r in ai_rows}

    # --- Aggregate into weekly buckets ---
    result = []
    for week_start, week_end in weeks:
        sessions = 0
        ai = 0
        d = week_start
        while d < week_end:
            key = str(d)
            sessions += session_by_day.get(key, 0)
            ai       += ai_by_day.get(key, 0)
            d += timedelta(days=1)
        result.append({
            "week": week_start.strftime("%d %b").lstrip("0"),
            "sessions": sessions,
            "ai_calls": ai,
        })

    total_incidents = (
        db.query(Incident)
        .filter(Incident.project_id == project_id)
        .count()
    )

    return {
        "weeks": result,
        "total_incidents": total_incidents,
    }
