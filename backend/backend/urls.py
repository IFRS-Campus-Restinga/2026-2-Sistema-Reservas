from django.contrib import admin
from django.urls import include, path

from .views import ReactAppView


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("session/", include("hub_integrations.urls")),
    path("", ReactAppView.as_view(), name="react"),
    path("<path:rota>", ReactAppView.as_view(), name="react-catchall"),
]