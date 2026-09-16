"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""


from django.contrib import admin
from django.urls import include, path
from .views import ReactAppView

urlpatterns = [
    # rota do admin
    # rota do admin
    path("django-admin/", admin.site.urls),
    
    # Integrações
    
    # Integrações
    path("session/", include("hub_integrations.urls")),
    path("api/", include("api.urls")),
    path("", ReactAppView.as_view(), name="react"),
    path("<path:rota>", ReactAppView.as_view(), name="react-catchall"),
]
