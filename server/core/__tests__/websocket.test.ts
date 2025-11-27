import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '../websocket.js';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import express from 'express';

// Mock ws module
vi.mock('ws', () => {
    const WebSocketServerMock = vi.fn();
    WebSocketServerMock.prototype.on = vi.fn();
    WebSocketServerMock.prototype.close = vi.fn((cb) => cb && cb());

    const WebSocketMock = vi.fn();
    (WebSocketMock as any).OPEN = 1;

    return {
        WebSocketServer: WebSocketServerMock,
        WebSocket: WebSocketMock
    };
});

describe('WebSocketService', () => {
    let webSocketService: WebSocketService;
    let server: any;

    beforeEach(() => {
        webSocketService = new WebSocketService();
        const app = express();
        server = createServer(app);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize WebSocket server', () => {
        webSocketService.initialize(server);
        expect(WebSocketServer).toHaveBeenCalledWith({ server });
    });

    it('should broadcast message to connected clients', () => {
        webSocketService.initialize(server);

        // Mock a client
        const mockClient = {
            readyState: 1, // OPEN
            OPEN: 1,
            send: vi.fn(),
            on: vi.fn()
        };

        // Access private clients set via any cast or by simulating connection
        // Since we mocked WebSocketServer, we need to simulate the 'connection' event
        const onConnection = (WebSocketServer as any).mock.instances[0].on.mock.calls.find((call: any) => call[0] === 'connection')[1];

        onConnection(mockClient);

        const data = { type: 'test' };
        webSocketService.broadcast(data);

        expect(mockClient.send).toHaveBeenCalledWith(JSON.stringify(data));
    });

    it('should not broadcast to closed clients', () => {
        webSocketService.initialize(server);

        // Mock a closed client
        const mockClient = {
            readyState: 3, // CLOSED
            send: vi.fn(),
            on: vi.fn()
        };

        const onConnection = (WebSocketServer as any).mock.instances[0].on.mock.calls.find((call: any) => call[0] === 'connection')[1];
        onConnection(mockClient);

        const data = { type: 'test' };
        webSocketService.broadcast(data);

        expect(mockClient.send).not.toHaveBeenCalled();
    });

    it('should track client count', () => {
        webSocketService.initialize(server);

        const mockClient1 = { readyState: 1, on: vi.fn() };
        const mockClient2 = { readyState: 1, on: vi.fn() };

        const onConnection = (WebSocketServer as any).mock.instances[0].on.mock.calls.find((call: any) => call[0] === 'connection')[1];

        onConnection(mockClient1);
        expect(webSocketService.getClientCount()).toBe(1);

        onConnection(mockClient2);
        expect(webSocketService.getClientCount()).toBe(2);
    });
});
