from rest_framework import permissions


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Permissão customizada para o Django REST Framework.

    Concede acesso irrestrito para métodos de leitura seguros (GET, HEAD, OPTIONS)
    e limita a modificação de dados (POST, PUT, PATCH, DELETE) a usuários
    autenticados que possuam privilégios de administrador (por enquanto) (is_staff=True).
    """

    # Variável de mensagem padrão utilizada prlo próprio Django REST Framework
    message = "Você não tem permissão para realizar esta ação."

    def has_permission(self, request, view):
        """
        Avalia se a requisição possui as credenciais necessárias para prosseguir.

        Args:
            request (HttpRequest): Objeto que contém os dados da requisição HTTP.
            view (APIView): A view correspondente que está processando a requisição.

        Returns:
            bool: True se o método for seguro ou se o usuário for administrador; 
                  False caso contrário (disparando a mensagem de erro configurada).
        """
        # Libera métodos de leitura que não alteram o estado do banco (SAFE_METHODS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Exige usuário autenticado e com a flag is_staff habilitada
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )