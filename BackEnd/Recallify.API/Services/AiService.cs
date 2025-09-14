using Recallify.API.Services.Interface;
using System.Text;
using System.Text.Json;
using static Recallify.API.Models.External.AiModels;

namespace Recallify.API.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _openAiApiKey;
        private readonly string _elevenLabsApiKey;
        private readonly JsonSerializerOptions _jsonOptions;
        public AiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _openAiApiKey = configuration["OpenAi:ApiKey"] ?? "";
            _elevenLabsApiKey = configuration["ElevenLabs:ApiKey"] ?? "";

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                WriteIndented = false
            };
        }

        public async Task<string> GenerateSummaryAsync(string content)
        {
            try
            {
                var request = new OpenAIRequest
                {
                    Model = "gpt-5",
                    Input = new List<OpenAIMessage>
            {
                new()
                {
                    Role = "system",
                    Content = new List<OpenAIContent>{
                        new OpenAIContent{ Text = "Você é um assistente especializado em criar resumos de estudo. Crie um resumo claro, conciso e bem estruturado do conteúdo fornecido, destacando os pontos principais e conceitos importantes.", Type = "input_text" }
                    }
                },
                new()
                {
                    Role = "user",
                    Content = new List<OpenAIContent>{
                        new OpenAIContent{ Text = $"Por favor, resuma o seguinte conteúdo de estudo:\n\n{content}", Type = "input_text" }
                    }
                }
            }
                };

                var json = JsonSerializer.Serialize(request, _jsonOptions);
                var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses")
                {
                    Content = httpContent
                };
                httpRequest.Headers.Add("Authorization", $"Bearer {_openAiApiKey}");

                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Failed to generate summary: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent, _jsonOptions);

                Console.WriteLine(responseContent);

                var summary = openAIResponse?.Output?.First(c => c.Type == "message").Content?.First().Text ?? "";

                if (string.IsNullOrEmpty(summary))
                {
                    throw new Exception("No summary generated from OpenAI response");
                }

                return summary;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating summary: {ex.Message}");
                throw;
            }
        }


        public async Task<List<FlashcardData>> GenerateFlashcardsAsync(string content)
        {
            try
            {
                var request = new OpenAIRequest
                {
                    Model = "gpt-5",
                    Input = new List<OpenAIMessage>
                {
                    new()
                    {
                        Role = "system",
                        Content = new List<OpenAIContent>
                        {
                            new OpenAIContent
                            {
                                Text = "Você é um assistente especializado em criar flashcards de estudo. Crie flashcards no formato de perguntas e respostas baseados no conteúdo fornecido. Retorne um array JSON válido com objetos contendo \"question\" e \"answer\". Crie entre 5 a 10 flashcards relevantes.",
                                Type = "input_text"
                            }
                        }
                    },
                    new()
                    {
                        Role = "user",
                        Content = new List<OpenAIContent>
                        {
                            new OpenAIContent
                            {
                                Text = $"Crie flashcards de estudo (perguntas e respostas) baseados no seguinte conteúdo:\n\n{content}\n\nRetorne apenas um array JSON válido no formato: [{{\"question\": \"pergunta\", \"answer\": \"resposta\"}}]",
                                Type = "input_text"
                            }
                        }
                    }
                }
                };

                var json = JsonSerializer.Serialize(request, _jsonOptions);
                var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses")
                {
                    Content = httpContent
                };

                httpRequest.Headers.Add("Authorization", $"Bearer {_openAiApiKey}");

                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Failed to generate flashcards: {response.StatusCode}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();

                Console.WriteLine(responseContent);

                var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent, _jsonOptions);

                var flashcardsText = openAIResponse?.Output?.First(c => c.Type == "message").Content?.First().Text ?? "";


                if (string.IsNullOrEmpty(flashcardsText))
                {
                    throw new Exception("No flashcards generated from OpenAI response");
                }

                // TODO: Limpar Texto
                flashcardsText = flashcardsText.Replace("```json", "").Replace("```", "").Trim();

                try
                {
                    var flashcards = JsonSerializer.Deserialize<List<FlashcardData>>(flashcardsText, _jsonOptions); // todo

                    return flashcards ?? new List<FlashcardData>();
                }
                catch (JsonException ex)
                {
                    throw new Exception("Failed to parse generated flashcards");
                }
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<string> GenerateAudioAsync(string text, string voice = "alloy")
        {
            try
            {
                // alterar o voiceDictionary para capturar sempre a versão mais atualizada da voz
                var voiceDictionary = new Dictionary<string, string> 
                {
                    { "burt", "4YYIPFl9wE5c4L2eu2Gb" }
                };

                var voiceId = voiceDictionary[voice];

                var request = new ElevenLabsRequest
                {
                    Text = text,
                    Model_Id = "eleven_multilingual_v2",
                    Voice_Settings = new ElevenLabsVoiceSettings
                    {
                        Stability = 0.5,
                        Similarity_Boost = 0.5
                    }
                };

                var json = JsonSerializer.Serialize(request, _jsonOptions);

                var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"https://api.elevenlabs.io/v1/text-to-speech/{voiceId}")
                {
                    Content = httpContent
                };

                httpRequest.Headers.Add("xi-api-key", _elevenLabsApiKey);

                var response = await _httpClient.SendAsync(httpRequest);

                var audioBytes = await response.Content.ReadAsByteArrayAsync();

                var base64Audio = Convert.ToBase64String(audioBytes);

                return base64Audio;
            }
            catch (Exception ex)
            {
                throw;
            }
        }
    }
}
