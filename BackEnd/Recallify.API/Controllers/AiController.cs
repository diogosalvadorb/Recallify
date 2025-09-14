using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Recallify.API.Services.Interface;
using static Recallify.API.Models.External.AiModels;

namespace Recallify.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("generate-audio")]
        public async Task<IActionResult> GenerateAudio([FromBody] GenerateAudioRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                    return BadRequest("Text is required");

                var audioContent = await _aiService.GenerateAudioAsync(request.Text, request.Voice);

                return Ok(new GenerateAudioResponse { AudioContent = audioContent });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
            catch (Exception ex)
            {
                return Problem(
                    title: "Failed to generate audio",
                    detail: ex.Message,
                    statusCode: 500);
            }
        }
    }
}
