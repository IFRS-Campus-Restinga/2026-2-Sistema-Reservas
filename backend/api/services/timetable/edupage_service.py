import requests

class EdupageService:
    """
    Serviço responsável por realizar as requisições HTTP ao EduPage,
    estabelecer a sessão e extrair os dados brutos da grade horária da timetable.
    Mais detalhes no README.md do módulo.
    """

    def __init__(self):

        # inicializa dados básicos utilizados para a captura de sessão

        self.base_url = "https://restinga.edupage.org"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "Origin": "https://restinga.edupage.org",
            "Referer": "https://restinga.edupage.org/timetable/",
            "X-Requested-With": "XMLHttpRequest"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def _criar_sessao(self):
        
        # Faz uma requisição inicial para obter os cookies de sessão (PHPSESSID)
        # necessários para a próxima chamada.
        
        url_sessao = f"{self.base_url}/timetable/"
        response = self.session.get(url_sessao)
        response.raise_for_status()
        # Os cookies (como PHPSESSID) são armazenados automaticamente no objeto self.session

    def obter_tabelas_brutas(self):
        """
        Extrai e retorna a lista de tabelas diretamente do EduPage.
        Retorna uma lista de dicionários contendo os dados crus (classrooms, lessons, etc).
        """
        # 1. Garante que temos a sessão válida
        self._criar_sessao()

        # 2. Faz o POST para extrair os dados
        url_dados = f"{self.base_url}/timetable/server/regulartt.js?__func=regularttGetData"
        
        payload = {
            "__args": [None, "65"], 
            "__gsh": "00000000"
        }

        response = self.session.post(url_dados, json=payload)
        response.raise_for_status()

        dados_json = response.json()

        # 3. Navega até a chave exata onde estão os dados relacionais
        try:
            tabelas = dados_json["r"]["dbiAccessorRes"]["tables"]
            return tabelas
        except KeyError as e:
            raise ValueError(f"Estrutura do JSON do EduPage mudou ou está inacessível. Chave não encontrada: {e}")
