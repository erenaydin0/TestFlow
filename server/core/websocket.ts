import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import logger from '../utils/logger.js';

export class WebSocketService {
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();

    constructor() { }

    /**
     * Initialize WebSocket server
     */
    public initialize(server: Server): void {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: WebSocket) => {
            this.clients.add(ws);
            logger.info('Client connected', { totalClients: this.clients.size });

            ws.on('close', () => {
                this.clients.delete(ws);
                logger.info('Client disconnected', { totalClients: this.clients.size });
            });

            ws.on('error', (error) => {
                logger.error('WebSocket client error', { error });
            });
        });

        logger.info('WebSocket server initialized');
    }

    /**
     * Broadcast message to all connected clients
     */
    public broadcast(data: any): void {
        this.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                try {
                    client.send(JSON.stringify(data));
                } catch (error: any) {
                    logger.error('Error broadcasting to client', { error: error.message });
                }
            }
        });
    }

    /**
     * Get count of connected clients
     */
    public getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Get count of healthy clients (OPEN state)
     */
    public getHealthyClientCount(): number {
        let count = 0;
        this.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                count++;
            }
        });
        return count;
    }

    /**
     * Close WebSocket server
     */
    public close(): void {
        if (this.wss) {
            this.wss.close(() => {
                logger.info('WebSocket server closed');
            });
            this.clients.clear();
        }
    }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
