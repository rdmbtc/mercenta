<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit;

use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Exceptions\ApiException;
use AppRoute\Sdk\Exceptions\NetworkException;
use AppRoute\Sdk\Exceptions\NotFoundException;
use AppRoute\Sdk\Exceptions\UnauthorizedException;
use AppRoute\Sdk\Exceptions\ValidationException;
use AppRoute\Sdk\Http\HttpTransport;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

final class HttpTransportTest extends TestCase
{
    public function testImplementsTransportInterface(): void
    {
        $transport = new HttpTransport('https://api.test.io/v1', 'test-key');
        $this->assertInstanceOf(TransportInterface::class, $transport);
    }

    public function testSuccessfulGetRequest(): void
    {
        $body = json_encode([
            'code' => 'OK',
            'message' => 'Success',
            'traceId' => 'trace-1',
            'data' => ['id' => 'prod-001', 'name' => 'Test'],
        ]);

        $transport = $this->createTransportWithMock([
            new Response(200, [], $body),
        ]);

        $result = $transport->request('GET', '/services');
        $this->assertSame('prod-001', $result['id']);
        $this->assertSame('Test', $result['name']);
    }

    public function testSuccessfulPostRequest(): void
    {
        $body = json_encode([
            'code' => 'ACCEPTED',
            'message' => 'Created',
            'traceId' => 'trace-2',
            'data' => ['status' => 'completed'],
        ]);

        $transport = $this->createTransportWithMock([
            new Response(200, [], $body),
        ]);

        $result = $transport->request('POST', '/orders', body: ['itemId' => 'item-001']);
        $this->assertSame('completed', $result['status']);
    }

    public function testNotFoundThrowsNotFoundException(): void
    {
        $body = json_encode([
            'code' => 'NOT_FOUND',
            'message' => 'Product not found',
            'traceId' => 'trace-3',
            'data' => null,
            'errors' => [],
        ]);

        $transport = $this->createTransportWithMock([
            new Response(404, [], $body),
        ]);

        $this->expectException(NotFoundException::class);
        $transport->request('GET', '/services/missing');
    }

    public function testUnauthorizedThrowsUnauthorizedException(): void
    {
        $body = json_encode([
            'code' => 'UNAUTHORIZED',
            'message' => 'Invalid API key',
            'traceId' => 'trace-4',
            'data' => null,
            'errors' => [],
        ]);

        $transport = $this->createTransportWithMock([
            new Response(401, [], $body),
        ]);

        $this->expectException(UnauthorizedException::class);
        $transport->request('GET', '/accounts');
    }

    public function testValidationErrorThrowsValidationException(): void
    {
        $body = json_encode([
            'code' => 'VALIDATION_ERROR',
            'message' => 'Validation failed',
            'traceId' => 'trace-5',
            'data' => null,
            'errors' => [
                ['field' => 'email', 'code' => 'INVALID_FORMAT', 'message' => 'Bad email'],
            ],
        ]);

        $transport = $this->createTransportWithMock([
            new Response(422, [], $body),
        ]);

        try {
            $transport->request('POST', '/orders');
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame('VALIDATION_ERROR', $e->errorCode);
            $this->assertSame('trace-5', $e->traceId);
            $this->assertCount(1, $e->errors);
            $this->assertSame('email', $e->errors[0]['field']);
        }
    }

    public function testIdempotencyReplayIsSuccess(): void
    {
        $body = json_encode([
            'code' => 'IDEMPOTENCY_REPLAY',
            'message' => 'Replayed',
            'traceId' => 'trace-6',
            'data' => ['orderId' => 'ord-001'],
        ]);

        $transport = $this->createTransportWithMock([
            new Response(200, [], $body),
        ]);

        $result = $transport->request('POST', '/orders');
        $this->assertSame('ord-001', $result['orderId']);
    }

    public function testNullDataReturnsNull(): void
    {
        $body = json_encode([
            'code' => 'OK',
            'message' => 'No content',
            'traceId' => 'trace-7',
        ]);

        $transport = $this->createTransportWithMock([
            new Response(200, [], $body),
        ]);

        $result = $transport->request('DELETE', '/some-resource');
        $this->assertNull($result);
    }

    /**
     * @param Response[] $responses
     */
    private function createTransportWithMock(array $responses): HttpTransport
    {
        $mock = new MockHandler($responses);
        $handlerStack = HandlerStack::create($mock);
        $guzzle = new Client(['handler' => $handlerStack]);

        $transport = new HttpTransport('https://api.test.io/v1', 'test-key', maxRetries: 0);

        // Inject the mock Guzzle client via reflection
        $ref = new ReflectionClass($transport);
        $prop = $ref->getProperty('client');
        $prop->setValue($transport, $guzzle);

        return $transport;
    }
}
