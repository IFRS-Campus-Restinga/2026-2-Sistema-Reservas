from django.contrib import admin
from django.urls import path, include

from .views import ReactAppView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', ReactAppView.as_view(), name='react'),
]