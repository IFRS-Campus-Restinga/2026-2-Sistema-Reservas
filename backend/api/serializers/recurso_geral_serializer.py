from rest_framework import serializers
from api.models import RecursoGeral


class RecursoGeralSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecursoGeral
        fields = "__all__"