namespace Recallify.API.Data
{
    public class MongoDbSettings
    {
        public required string ConnectionString { get; set; }
        public required string DatabaseName { get; set; }
        public string NotesCollectionName { get; set; } = "notes";
        public string CategoriesCollectionName { get; set; } = "categories";
        public string FlashcardsCollectionName { get; set; } = "flashcards";
    }
}
