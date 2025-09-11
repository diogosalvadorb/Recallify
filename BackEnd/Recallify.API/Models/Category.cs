using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Recallify.API.Models
{
    public class Category
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("name")]
        public required string Name { get; set; }

        [BsonElement("color")]
        public string? Color { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateCategoryRequest
    {
        public required string Name { get; set; }
        public string? Color { get; set; }
    }

    public class UpdateCategoryRequest
    {
        public string? Name { get; set; }
        public string? Color { get; set; }
    }
}
