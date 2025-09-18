using Microsoft.AspNetCore.Mvc;
using Recallify.API.Models;
using Recallify.API.Repository.Interface;
using Recallify.API.Services.Interface;
using static Recallify.API.Models.External.AiModels;

namespace Recallify.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotesController : ControllerBase
    {
        private readonly IRepository _repository;
        private readonly IAiService _aiService;
        public NotesController(IRepository repository, IAiService aiService)
        {
            _repository = repository;
            _aiService = aiService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotes([FromQuery] string? categoryId = null)
        {
            var notes = await _repository.GetAllNotesAsync(categoryId);
            return Ok(notes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetNoteById(string id)
        {
            var note = await _repository.GetNoteByIdAsync(id);
            if (note == null) return NotFound();
            return Ok(note);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNote([FromBody] CreateNoteRequest request)
        {
            if (!string.IsNullOrEmpty(request.CategoryId))
            {
                var category = await _repository.GetCategoryByIdAsync(request.CategoryId);
                if (category == null)
                    return BadRequest("Category not found");
            }

            var note = new Note
            {
                Title = request.Title,
                Content = request.Content,
                Summary = request.Summary,
                AudioUrl = request.AudioUrl,
                CategoryId = request.CategoryId,
            };

            // gera sumário com ia
            note.Summary = await _aiService.GenerateSummaryAsync(request.Content);

            var createdNote = await _repository.CreateNoteAsync(note);

            return CreatedAtAction(nameof(GetNoteById), new { id = createdNote.Id }, createdNote);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNote(string id, [FromBody] UpdateNoteRequest request)
        {
            try
            {
                var existingNote = await _repository.GetNoteByIdAsync(id);

                if (existingNote == null) return NotFound();

                if (!string.IsNullOrEmpty(request.CategoryId))
                {
                    var category = await _repository.GetCategoryByIdAsync(request.CategoryId);
                    if (category == null)
                    {
                        return BadRequest("Category not found");
                    }
                }

                if (!string.IsNullOrEmpty(request.Title))
                    existingNote.Title = request.Title;
                if (!string.IsNullOrEmpty(request.Content))
                    existingNote.Content = request.Content;
                if (request.Summary != null)
                    existingNote.Summary = request.Summary;
                if (request.AudioUrl != null)
                    existingNote.AudioUrl = request.AudioUrl;
                if (request.CategoryId != null)
                    existingNote.CategoryId = request.CategoryId;

                var updatedNote = await _repository.UpdateNoteAsync(existingNote);
                return Ok(updatedNote);
            }
            catch (Exception ex)
            {
                return this.StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error when trying to update. Error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNote(string id)
        {
            try
            {
                var success = await _repository.DeleteNoteAsync(id);

                return success ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                return this.StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error when trying to delete. Error: {ex.Message}");
            }
        }

        [HttpPost("{id}/generate-summary")]
        public async Task<IActionResult> GenerateNoteSummary(string id)
        {
            try
            {
                var note = await _repository.GetNoteByIdAsync(id);
                if (note == null) return NotFound();

                var summary = await _aiService.GenerateSummaryAsync(note.Content);

                note.Summary = summary;
                await _repository.UpdateNoteAsync(note);

                return Ok(new GenerateSummaryResponse { Summary = summary });
            }
            catch (Exception ex)
            {
                return Problem(
                    title: "Failed to generate summary",
                    detail: ex.Message,
                    statusCode: 500);
            }
        }

        [HttpPost("{id}/generate-audio")]
        public async Task<IActionResult> GenerateNoteAudio(string id, [FromBody] GenerateAudioRequest request)
        {
            try
            {
                var note = await _repository.GetNoteByIdAsync(id);
                if (note == null) return NotFound();

                var textToSpeak = !string.IsNullOrEmpty(note.Summary) ? note.Summary : note.Content;
                var audioContent = await _aiService.GenerateAudioAsync(textToSpeak, request.Voice);

                return Ok(new GenerateAudioResponse { AudioContent = audioContent });
            }
            catch (Exception ex)
            {
                return Problem(
                    title: "Failed to generate audio",
                    detail: ex.Message,
                    statusCode: 500);
            }
        }

        [HttpPost("{id}/flashcards/generate")]
        public async Task<IActionResult> GenerateNoteFlashcards(string id)
        {
            try
            {
                var note = await _repository.GetNoteByIdAsync(id);
                if (note == null) return NotFound();

                var flashcardData = await _aiService.GenerateFlashcardsAsync(note.Content);

                var flashcards = new List<Flashcard>();

                foreach (var data in flashcardData)
                {
                    var flashcard = new Flashcard
                    {
                        NoteId = id,
                        Question = data.Question,
                        Answer = data.Answer
                    };

                    var createdFlashcard = await _repository.CreateFlashcardAsync(flashcard);
                    flashcards.Add(createdFlashcard);
                }

                return Ok(flashcards);
            }
            catch (Exception ex)
            {
                return Problem(
                    title: "Failed to generate flashcards",
                    detail: ex.Message,
                    statusCode: 500);
            }
        }

    }
}
