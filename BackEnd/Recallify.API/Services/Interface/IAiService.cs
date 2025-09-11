namespace Recallify.API.Services.Interface
{
    public interface IAiService
    {
        Task<string> GenerateSummaryAsync(string content);
    }
}
