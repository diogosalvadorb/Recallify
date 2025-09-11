using Recallify.API.Services.Interface;
using System.Text;
using System.Text.Json;
using static Recallify.API.Models.External.AiModels;

namespace Recallify.API.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private string _openAiApiKey;
        public AiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _openAiApiKey = configuration["OpenAi:ApiKey"] ?? "";
        }

        public async Task<string> GenerateSummaryAsync(string content)
        {
            var request = new OpenAiRequest
            {
                model = "gpt-4o-mini",
                input = $"Resuma este texto de forma concisa: {content}"
            };

            var json = JsonSerializer.Serialize(request);

            var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses")
            {
                Content = httpContent
            };

            httpRequest.Headers.Add("Authorization", $"Bearer {_openAiApiKey}");

            var response = await _httpClient.SendAsync(httpRequest);

            var responseText = await response.Content.ReadAsStringAsync();

            Console.WriteLine(responseText);

            var openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseText);

            var summary = openAiResponse.output.First().content.First().text;

            return summary;
        }
    }
}
