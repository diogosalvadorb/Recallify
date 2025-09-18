using Microsoft.AspNetCore.Mvc;
using Recallify.API.Models;
using Recallify.API.Repository.Interface;

namespace Recallify.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly IRepository _repository;
        public CategoriesController(IRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _repository.GetAllCategoriesAsync();
            return Ok(categories);
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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(string id, [FromBody] UpdateCategoryRequest request)
        {
            try
            {
                var existingCategory = await _repository.GetCategoryByIdAsync(id);
                if (existingCategory == null)
                {
                    return NotFound();
                }

                if (!string.IsNullOrEmpty(request.Name))
                    existingCategory.Name = request.Name;
                if (request.Color != null)
                    existingCategory.Color = request.Color;

                var updatedCategory = await _repository.UpdateCategoryAsync(existingCategory);
                return updatedCategory != null ? Ok(updatedCategory) : NotFound();
            }
            catch (Exception ex)
            {
                return this.StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error when trying to update. Error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(string id)
        {
            try
            {
                var success = await _repository.DeleteCategoryAsync(id);
                return success ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                return this.StatusCode(StatusCodes.Status500InternalServerError,
                    $"Error when trying to delete. Error: {ex.Message}");
            }
        }
    }
}
