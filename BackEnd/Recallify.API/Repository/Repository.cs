using MongoDB.Driver;
using MongoDB.Driver.Linq;
using Recallify.API.Data;
using Recallify.API.Models;
using Recallify.API.Repository.Interface;

namespace Recallify.API.Repository
{
    public class Repository : IRepository
    {
        private readonly IMongoCollection<Note> _notes;
        private readonly IMongoCollection<Category> _categories;
        private readonly IMongoCollection<Flashcard> _flashcards;
        public Repository(IMongoDatabase database, MongoDbSettings settings)
        {
            _notes = database.GetCollection<Note>(settings.NotesCollectionName);
            _categories = database.GetCollection<Category>(settings.CategoriesCollectionName);
            _flashcards = database.GetCollection<Flashcard>(settings.FlashcardsCollectionName);
        }

        public async Task<IEnumerable<Note>> GetAllNotesAsync(string? categoryId = null)
        {
            var filter = Builders<Note>.Filter.Empty;

            if (!string.IsNullOrEmpty(categoryId))
            {
                filter = filter & Builders<Note>.Filter.Eq(n => n.CategoryId, categoryId);
            }

            return await _notes
                .Find(filter)
                .SortByDescending(n => n.UpdatedAt)
                .ToListAsync();
        }

        public async Task<Note?> GetNoteByIdAsync(string id)
        {
            return await _notes.Find(n => n.Id == id.ToString()).FirstOrDefaultAsync();
        }

        public async Task<Note> CreateNoteAsync(Note note)
        {
            await _notes.InsertOneAsync(note);
            return note;
        }

        public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
        {
            return await _categories
                .AsQueryable()
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Category?> GetCategoryByIdAsync(string id)
        {
            return await _categories
                .Find(c => c.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<Category> CreateCategoryAsync(Category category)
        {
            await _categories.InsertOneAsync(category);
            return category;
        }
    }
}
