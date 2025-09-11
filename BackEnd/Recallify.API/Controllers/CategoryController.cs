using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Recallify.API.Models;
using Recallify.API.Repository.Interface;

namespace Recallify.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly IRepository _repository;
        public CategoryController(IRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(string id)
        {
            var note = await _repository.GetCategoryByIdAsync(id);
            if (note == null) return NotFound();

            return Ok(note);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            var category = new Category 
            { 
                Name = request.Name, 
                Color = request.Color
            };
            var createdCategory = await _repository.CreateCategoryAsync(category);

            return CreatedAtAction(nameof(GetCategoryById), new { id = createdCategory.Id }, createdCategory);
        }
    }
}
