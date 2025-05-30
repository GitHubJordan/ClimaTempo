  // Configuração da API - Estrutura organizada
        const API_CONFIG = {
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            apiKey: '10ecc3fbaf5cec4c15b4c77c1c89ce85', // OpenWeatherMap API Key
            endpoints: {
                current: '/weather',
                forecast: '/forecast', 
                history: '/onecall/timemachine',
                search: '/weather' // Para buscar cidades
            },
            params: {
                units: 'metric', // Celsius
                lang: 'pt_br'    // Português brasileiro
            }
        };

        // Classe para gerenciar requisições da API
        class WeatherAPI {
            constructor(config) {
                this.config = config;
                this.updateStatus('Conectado');
            }

            // Método para buscar clima atual por cidade
            async getCurrentWeatherByCity(city) {
                const url = `${this.config.baseUrl}${this.config.endpoints.current}?q=${encodeURIComponent(city)}&appid=${this.config.apiKey}&units=${this.config.params.units}&lang=${this.config.params.lang}`;
                return await this.makeRequest(url);
            }

            // Método para buscar clima atual por coordenadas
            async getCurrentWeatherByCoords(lat, lon) {
                const url = `${this.config.baseUrl}${this.config.endpoints.current}?lat=${lat}&lon=${lon}&appid=${this.config.apiKey}&units=${this.config.params.units}&lang=${this.config.params.lang}`;
                return await this.makeRequest(url);
            }

            // Método para fazer requisições HTTP
            async makeRequest(url) {
                try {
                    this.updateStatus('Carregando...');
                    const response = await fetch(url);
                    const data = await response.json();

                    if (response.ok) {
                        this.updateStatus('Conectado');
                        return { success: true, data };
                    } else {
                        this.updateStatus('Erro');
                        return { success: false, error: data.message || 'Erro desconhecido' };
                    }
                } catch (error) {
                    this.updateStatus('Desconectado');
                    return { success: false, error: 'Erro de conexão' };
                }
            }

            // Atualizar status da API na interface
            updateStatus(status) {
                const statusElement = document.getElementById('apiStatus');
                if (statusElement) {
                    statusElement.textContent = status;
                    statusElement.style.color = status === 'Conectado' ? '#2ecc71' : 
                                              status === 'Carregando...' ? '#f39c12' : '#e74c3c';
                }
            }
        }

        // Instanciar API
        const weatherAPI = new WeatherAPI(API_CONFIG);

        // Event listeners
        document.getElementById('cityInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchWeather();
            }
        });

        // Função para buscar clima por nome da cidade
        async function searchWeather() {
            const city = document.getElementById('cityInput').value.trim();
            if (!city) {
                showError('Por favor, digite o nome de uma cidade.');
                return;
            }

            showLoading();
            
            const result = await weatherAPI.getCurrentWeatherByCity(city);
            
            if (result.success) {
                displayWeather(result.data);
            } else {
                showError(result.error === 'city not found' ? 
                    'Cidade não encontrada. Verifique o nome e tente novamente.' : 
                    result.error);
            }
            
            hideLoading();
        }

        // Função para buscar clima por geolocalização
        function getLocationWeather() {
            if (!navigator.geolocation) {
                showError('Geolocalização não é suportada pelo seu navegador.');
                return;
            }

            showLoading();
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    const result = await weatherAPI.getCurrentWeatherByCoords(latitude, longitude);
                    
                    if (result.success) {
                        displayWeather(result.data);
                    } else {
                        showError('Erro ao obter dados meteorológicos da sua localização.');
                    }
                    
                    hideLoading();
                },
                (error) => {
                    hideLoading();
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            showError('Acesso à localização negado. Permita o acesso para usar esta funcionalidade.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            showError('Localização não disponível.');
                            break;
                        case error.TIMEOUT:
                            showError('Tempo limite para obter localização esgotado.');
                            break;
                        default:
                            showError('Erro desconhecido ao obter localização.');
                            break;
                    }
                }
            );
        }

        // Função para exibir os dados do clima
        function displayWeather(data) {
            document.getElementById('cityName').textContent = data.name;
            document.getElementById('countryName').textContent = data.sys.country;
            document.getElementById('weatherDescription').textContent = data.weather[0].description;
            document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
            document.getElementById('feelsLike').textContent = `Sensação térmica: ${Math.round(data.main.feels_like)}°C`;
            document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
            document.getElementById('humidity').textContent = `${data.main.humidity}%`;
            document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
            document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

            // Atualizar background baseado no clima
            updateBackground(data.weather[0].main);

            // Mostrar card do clima
            document.getElementById('weatherCard').classList.remove('hidden');
            hideError();
        }

        // Função para atualizar o background baseado no clima
        function updateBackground(weatherMain) {
            const body = document.body;
            switch(weatherMain.toLowerCase()) {
                case 'clear':
                    body.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                    break;
                case 'clouds':
                    body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    break;
                case 'rain':
                case 'drizzle':
                    body.style.background = 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)';
                    break;
                case 'thunderstorm':
                    body.style.background = 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)';
                    break;
                case 'snow':
                    body.style.background = 'linear-gradient(135deg, #e6ddd4 0%, #d5d5d5 100%)';
                    break;
                case 'mist':
                case 'fog':
                    body.style.background = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
                    break;
                default:
                    body.style.background = 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)';
            }
        }

        // Funções utilitárias
        function showLoading() {
            document.getElementById('loadingDiv').classList.remove('hidden');
            document.getElementById('weatherCard').classList.add('hidden');
            hideError();
        }

        function hideLoading() {
            document.getElementById('loadingDiv').classList.add('hidden');
        }

        function showError(message) {
            document.getElementById('errorMessage').textContent = message;
            document.getElementById('errorDiv').classList.remove('hidden');
            document.getElementById('weatherCard').classList.add('hidden');
        }

        function hideError() {
            document.getElementById('errorDiv').classList.add('hidden');
        }

        // Inicialização da aplicação
        window.addEventListener('load', () => {
            console.log('🌤️ ClimaTempo carregado com sucesso!');
            console.log('📡 API Configuration:', {
                provider: 'OpenWeatherMap',
                baseUrl: API_CONFIG.baseUrl,
                endpoints: Object.keys(API_CONFIG.endpoints),
                language: API_CONFIG.params.lang,
                units: API_CONFIG.params.units
            });
            
            if (navigator.geolocation) {
                console.log('📍 Geolocalização disponível');
            }
        });