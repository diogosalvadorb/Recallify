using static Recallify.API.Models.External.AiModels;

namespace Recallify.API.Services.Interface
{
    public interface IAiService
    {
        Task<string> GenerateSummaryAsync(string content);
        Task<List<FlashcardData>> GenerateFlashcardsAsync(string content);
        Task<string> GenerateAudioAsync(string text, string voice = "burt");
    }
}
