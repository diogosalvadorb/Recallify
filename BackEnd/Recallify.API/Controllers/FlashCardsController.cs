using Microsoft.AspNetCore.Mvc;
using Recallify.API.Models;
using Recallify.API.Repository.Interface;

namespace Recallify.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FlashCardsController : ControllerBase
    {
        private readonly IRepository _repository;
        public FlashCardsController(IRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetFlashcards()
        {
            var flashcards = await _repository.GetFlashcardsAsync();
            return Ok(flashcards);
        }

        [HttpGet("/api/notes/{noteId}/flashcards")]
        public async Task<IActionResult> GetFlashcardsByNote(string noteId)
        {
            var note = await _repository.GetNoteByIdAsync(noteId);
            if (note == null) return NotFound("Note not found");

            var flashcards = await _repository.GetFlashcardsByNoteIdAsync(noteId);
            return Ok(flashcards);
        }

        [HttpPost("/api/notes/{noteId}/flashcards")]
        public async Task<IActionResult> CreateFlashcards(string noteId, [FromBody] CreateFlashcardsRequest request)
        {
            var note = await _repository.GetNoteByIdAsync(noteId);
            if (note == null) return NotFound("Note not found");

            var createdFlashcards = new List<Flashcard>();
            foreach (var flashcardRequest in request.Flashcards)
            {
                var flashcard = new Flashcard
                {
                    NoteId = noteId,
                    Question = flashcardRequest.Question,
                    Answer = flashcardRequest.Answer
                };

                var createdFlashcard = await _repository.CreateFlashcardAsync(flashcard);
                createdFlashcards.Add(createdFlashcard);
            }

            return Created($"/api/notes/{noteId}/flashcards", createdFlashcards);

        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFlashcard(string id)
        {
            var success = await _repository.DeleteFlashcardAsync(id);
            return success ? NoContent() : NotFound();
        }
    }
}