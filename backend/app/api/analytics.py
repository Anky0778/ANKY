from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.utils.auth_dependency import get_current_user
from app.services.project_service import get_project_by_id
from app.services.analytics_service import get_project_analytics, get_project_trend
from app.schemas.analytics import ProjectAnalyticsResponse

router = APIRouter(prefix="/projects", tags=["analytics"])


@router.get(
    "/{project_id}/analytics",
    response_model=ProjectAnalyticsResponse
)
def analytics(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)
    return get_project_analytics(db, project_id)


@router.get("/{project_id}/analytics/trend")
def trend(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    get_project_by_id(db, project_id, user.id)
    return get_project_trend(db, project_id)
