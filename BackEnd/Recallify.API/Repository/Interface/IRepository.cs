using Recallify.API.Models;

namespace Recallify.API.Repository.Interface
{
    public interface IRepository
    {
        Task<IEnumerable<Note>> GetAllNotesAsync(string? categoryId = null);
        Task<Note?> GetNoteByIdAsync(string id);
        Task<Note> CreateNoteAsync(Note note);


        //Categories
        Task<IEnumerable<Category>> GetAllCategoriesAsync();
        Task<Category?> GetCategoryByIdAsync(string id);
        Task<Category> CreateCategoryAsync(Category category);
        Task<Category> UpdateCategoryAsync(Category category);
        Task<bool> DeleteCategoryAsync(string id);
    }
}
