using System.ComponentModel.DataAnnotations;
using Api.Common.Filters;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Api.Tests.Common.Filters;

public class ValidationFilterTests
{
    private class TestModel
    {
        [Required]
        public string? Name { get; set; }

        [Range(1, 100)]
        public int Age { get; set; }
    }

    private static EndpointFilterInvocationContext CreateContext(params object?[] args)
    {
        var httpContext = new DefaultHttpContext();
        return EndpointFilterInvocationContext.Create(httpContext, args);
    }

    [Fact]
    public async Task InvokeAsync_ModelArgumentMissing_ReturnsBadRequest()
    {
        var filter = new ValidationFilter<TestModel>();
        var context = CreateContext("not the model type");

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>(null));

        var badRequest = Assert.IsType<BadRequest<string>>(result);
        Assert.Equal("Invalid request body.", badRequest.Value);
    }

    [Fact]
    public async Task InvokeAsync_NoArguments_ReturnsBadRequest()
    {
        var filter = new ValidationFilter<TestModel>();
        var context = CreateContext();

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>(null));

        Assert.IsType<BadRequest<string>>(result);
    }

    [Fact]
    public async Task InvokeAsync_InvalidModel_ReturnsValidationProblemWithErrors()
    {
        var filter = new ValidationFilter<TestModel>();
        var context = CreateContext(new TestModel { Name = null, Age = 0 });

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>(null));

        var statusResult = Assert.IsAssignableFrom<IStatusCodeHttpResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, statusResult.StatusCode);

        var valueResult = Assert.IsAssignableFrom<IValueHttpResult>(result);
        var problemDetails = Assert.IsAssignableFrom<HttpValidationProblemDetails>(valueResult.Value);
        Assert.Contains("Name", problemDetails.Errors.Keys);
        Assert.Contains("Age", problemDetails.Errors.Keys);
    }

    [Fact]
    public async Task InvokeAsync_InvalidModel_DoesNotCallNext()
    {
        var filter = new ValidationFilter<TestModel>();
        var context = CreateContext(new TestModel { Name = null, Age = 0 });
        var nextCalled = false;

        await filter.InvokeAsync(context, _ =>
        {
            nextCalled = true;
            return ValueTask.FromResult<object?>(null);
        });

        Assert.False(nextCalled);
    }

    [Fact]
    public async Task InvokeAsync_ValidModel_InvokesNextAndReturnsItsResult()
    {
        var filter = new ValidationFilter<TestModel>();
        var context = CreateContext(new TestModel { Name = "Rex", Age = 5 });
        var expected = new object();
        var nextCalled = false;

        var result = await filter.InvokeAsync(context, _ =>
        {
            nextCalled = true;
            return ValueTask.FromResult<object?>(expected);
        });

        Assert.True(nextCalled);
        Assert.Same(expected, result);
    }

    [Fact]
    public async Task InvokeAsync_PicksFirstMatchingArgumentByType()
    {
        var filter = new ValidationFilter<TestModel>();
        var context = CreateContext(42, "ignored", new TestModel { Name = "Rex", Age = 5 });

        var result = await filter.InvokeAsync(context, _ => ValueTask.FromResult<object?>("ok"));

        Assert.Equal("ok", result);
    }
}
