using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Recallify.API.Data;
using Recallify.API.Repository;
using Recallify.API.Repository.Interface;
using Recallify.API.Services;
using Recallify.API.Services.Interface;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB"));

builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<MongoDbSettings>>().Value);

builder.Services.AddScoped<IMongoClient>(serviceProvider =>
{
    var settings = builder.Configuration.GetSection("MongoDB").Get<MongoDbSettings>()
        ?? throw new InvalidOperationException("Configurações do MongoDB não estão configuradas");
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddScoped<IMongoDatabase>(serviceProvider =>
{
    var client = serviceProvider.GetRequiredService<IMongoClient>();
    var settings = builder.Configuration.GetSection("MongoDB").Get<MongoDbSettings>()
        ?? throw new InvalidOperationException("Configurações do MongoDB não estão configuradas");
    return client.GetDatabase(settings.DatabaseName);
});


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IRepository, Repository>();
builder.Services.AddScoped<IAiService, AiService>();
builder.Services.AddHttpClient<IAiService, AiService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins(
                    "http://localhost:3000"
                  )
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .SetIsOriginAllowed(origin => true);
        }
        else
        {
            // CORS restrito para produção
            policy.WithOrigins("https://your-production-domain.com")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
