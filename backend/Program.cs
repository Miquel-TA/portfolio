using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// Setup JWT Authentication
var jwtKey = "SuperSecretKeyThatIsAtLeast32BytesLongForPortfolio!!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "portfolio",
            ValidAudience = "portfolio",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

var dataFilePath = Path.Combine(app.Environment.ContentRootPath, "data", "data.json");

// Generate a bcrypt hash for the hardcoded password "admin123" at startup
var hardcodedHash = BCrypt.Net.BCrypt.HashPassword("admin123");

// Login Endpoint
app.MapPost("/api/auth/login", (LoginRequest request) =>
{
    var isValid = BCrypt.Net.BCrypt.Verify(request.Password, hardcodedHash);
    
    if (request.Username == "admin" && isValid)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim("id", "1"), new Claim(ClaimTypes.Name, "admin") }),
            Expires = DateTime.UtcNow.AddHours(2),
            Issuer = "portfolio",
            Audience = "portfolio",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Results.Ok(new { token = tokenHandler.WriteToken(token) });
    }
    return Results.Unauthorized();
});

// Define a minimal endpoint to get data
app.MapGet("/api/portfolio", async () =>
{
    if (!File.Exists(dataFilePath))
    {
        return Results.NotFound(new { message = "Data not found" });
    }
    
    var jsonString = await File.ReadAllTextAsync(dataFilePath);
    var data = JsonSerializer.Deserialize<object>(jsonString);
    return Results.Ok(data);
});

// Define endpoint to update data (Requires Auth)
app.MapPost("/api/portfolio", async (HttpRequest request) =>
{
    using var reader = new StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    
    try
    {
        // Validate it's valid JSON
        JsonDocument.Parse(body);
        
        // Ensure directory exists
        var directory = Path.GetDirectoryName(dataFilePath);
        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }
        
        await File.WriteAllTextAsync(dataFilePath, body);
        return Results.Ok(new { message = "Data saved successfully" });
    }
    catch (JsonException)
    {
        return Results.BadRequest(new { message = "Invalid JSON format" });
    }
}).RequireAuthorization();

app.Run();

class LoginRequest {
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}
