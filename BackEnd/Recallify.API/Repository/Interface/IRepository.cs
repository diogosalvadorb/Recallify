using Recallify.API.Models;

namespace Recallify.API.Repository.Interface
{
    public interface IRepository
    {
        //Notes
        Task<IEnumerable<Note>> GetAllNotesAsync(string? categoryId = null);
        Task<Note?> GetNoteByIdAsync(string id);
        Task<Note> CreateNoteAsync(Note note);
        Task<Note?> UpdateNoteAsync(Note note);
        Task<bool> DeleteNoteAsync(string id);

        //Categories
        Task<IEnumerable<Category>> GetAllCategoriesAsync();
        Task<Category?> GetCategoryByIdAsync(string id);
        Task<Category> CreateCategoryAsync(Category category);
        Task<Category?> UpdateCategoryAsync(Category category);
        Task<bool> DeleteCategoryAsync(string id);

        Task<IEnumerable<Flashcard>> GetFlashcardsAsync();
        Task<IEnumerable<Flashcard>> GetFlashcardsByNoteIdAsync(string noteId);
        Task<Flashcard?> GetFlashcardByIdAsync(string id);
        Task<Flashcard> CreateFlashcardAsync(Flashcard flashcard);
        Task<Flashcard?> UpdateFlashcardAsync(Flashcard flashcard);
        Task<bool> DeleteFlashcardAsync(string id);
    }
}
