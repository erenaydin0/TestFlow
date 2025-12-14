import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env and .env.local files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, '.env.local') });

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface AuthenticatedClient {
    ws: WebSocket;
    clientId: string;
    userId: string;
    workspaceId: string;
    connectedAt: Date;
    isAuthenticated: boolean;
}

interface AuthMessage {
    type: 'auth';
    token: string;
    workspaceId: string;
}

interface JWTPayload {
    sub?: string;  // NextAuth uses 'sub' for user ID
    id?: string;
    userId?: string;  // Custom token uses 'userId'
    email?: string;
    name?: string;
    iat?: number;
    exp?: number;
}

// ============================================================================
// WebSocket Service Class
// ============================================================================

export class WebSocketService {
    private wss: WebSocketServer | null = null;
    
    // Client management - authenticated clients only
    private clients: Map<string, AuthenticatedClient> = new Map(); // clientId -> client
    private workspaceClients: Map<string, Set<string>> = new Map(); // workspaceId -> clientIds
    private userClients: Map<string, Set<string>> = new Map(); // userId -> clientIds
    
    // Pending connections waiting for authentication
    private pendingClients: Map<WebSocket, NodeJS.Timeout> = new Map();
    
    // Auth timeout (10 seconds to authenticate after connection)
    private readonly AUTH_TIMEOUT = 10000;

    constructor() { }

    // ============================================================================
    // Initialization
    // ============================================================================

    /**
     * Initialize WebSocket server
     */
    public initialize(server: Server): void {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
            const clientId = this.generateClientId();
            
            logger.info('WebSocket client connecting, waiting for auth...', { clientId });

            // Set auth timeout - client must authenticate within AUTH_TIMEOUT
            const authTimeout = setTimeout(() => {
                if (this.pendingClients.has(ws)) {
                    logger.warn('WebSocket auth timeout, closing connection', { clientId });
                    this.pendingClients.delete(ws);
                    ws.close(4001, 'Authentication timeout');
                }
            }, this.AUTH_TIMEOUT);

            this.pendingClients.set(ws, authTimeout);

            // Handle messages
            ws.on('message', async (data: Buffer) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    // Handle auth message for pending clients
                    if (this.pendingClients.has(ws) && message.type === 'auth') {
                        await this.handleAuthMessage(ws, clientId, message as AuthMessage);
                        return;
                    }

                    // For authenticated clients, handle other message types if needed
                    // Currently we only receive messages for auth, but this can be extended
                    
                } catch (error: any) {
                    logger.error('Error processing WebSocket message', { 
                        clientId, 
                        error: error.message 
                    });
                }
            });

            // Handle close
            ws.on('close', () => {
                // Clean up pending client
                const timeout = this.pendingClients.get(ws);
                if (timeout) {
                    clearTimeout(timeout);
                    this.pendingClients.delete(ws);
                }

                // Clean up authenticated client
                this.removeClient(clientId);
            });

            // Handle errors
            ws.on('error', (error) => {
                logger.error('WebSocket client error', { clientId, error });
            });
        });

        logger.info('WebSocket server initialized with authentication support');
    }

    // ============================================================================
    // Authentication
    // ============================================================================

    /**
     * Handle authentication message from client
     */
    private async handleAuthMessage(
        ws: WebSocket, 
        clientId: string, 
        message: AuthMessage
    ): Promise<void> {
        const { token, workspaceId } = message;

        // Clear auth timeout
        const timeout = this.pendingClients.get(ws);
        if (timeout) {
            clearTimeout(timeout);
            this.pendingClients.delete(ws);
        }

        // Verify token
        const payload = this.verifyToken(token);
        if (!payload) {
            logger.warn('WebSocket auth failed - invalid token', { clientId });
            ws.close(4002, 'Invalid token');
            return;
        }

        const userId = payload.userId || payload.sub || payload.id;
        if (!userId) {
            logger.warn('WebSocket auth failed - no user ID in token', { clientId, payload });
            ws.close(4002, 'Invalid token - no user ID');
            return;
        }

        if (!workspaceId) {
            logger.warn('WebSocket auth failed - no workspace ID', { clientId, userId });
            ws.close(4003, 'Workspace ID required');
            return;
        }

        // Verify user is a member of the requested workspace
        const membership = await this.verifyWorkspaceMembership(userId, workspaceId);
        if (!membership) {
            logger.warn('WebSocket auth failed - user not a member of workspace', { 
                clientId, 
                userId, 
                workspaceId 
            });
            ws.close(4004, 'Access denied to workspace');
            return;
        }

        // Create authenticated client
        const client: AuthenticatedClient = {
            ws,
            clientId,
            userId,
            workspaceId,
            connectedAt: new Date(),
            isAuthenticated: true
        };

        // Register client
        this.registerClient(client);

        // Send auth success message
        this.sendToClient(clientId, {
            type: 'auth:success',
            clientId,
            userId,
            workspaceId
        });

        logger.info('WebSocket client authenticated', { 
            clientId, 
            userId, 
            workspaceId,
            totalClients: this.clients.size 
        });
    }

    /**
     * Verify JWT token
     */
    private verifyToken(token: string): JWTPayload | null {
        try {
            const secret = process.env.NEXTAUTH_SECRET;
            if (!secret) {
                logger.error('NEXTAUTH_SECRET not configured');
                return null;
            }

            const decoded = jwt.verify(token, secret) as JWTPayload;
            return decoded;
        } catch (error: any) {
            logger.debug('Token verification failed', { error: error.message });
            return null;
        }
    }

    /**
     * Verify user is a member of the workspace
     */
    private async verifyWorkspaceMembership(userId: string, workspaceId: string): Promise<boolean> {
        try {
            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId,
                        workspaceId,
                    },
                },
            });

            return !!membership;
        } catch (error: any) {
            logger.error('Error verifying workspace membership', { 
                userId, 
                workspaceId, 
                error: error.message 
            });
            return false;
        }
    }

    // ============================================================================
    // Client Management
    // ============================================================================

    /**
     * Generate unique client ID
     */
    private generateClientId(): string {
        return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Register authenticated client
     */
    private registerClient(client: AuthenticatedClient): void {
        const { clientId, userId, workspaceId } = client;

        // Add to clients map
        this.clients.set(clientId, client);

        // Add to workspace clients
        if (!this.workspaceClients.has(workspaceId)) {
            this.workspaceClients.set(workspaceId, new Set());
        }
        this.workspaceClients.get(workspaceId)!.add(clientId);

        // Add to user clients
        if (!this.userClients.has(userId)) {
            this.userClients.set(userId, new Set());
        }
        this.userClients.get(userId)!.add(clientId);
    }

    /**
     * Remove client from all maps
     */
    private removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { userId, workspaceId } = client;

        // Remove from clients map
        this.clients.delete(clientId);

        // Remove from workspace clients
        const workspaceClientSet = this.workspaceClients.get(workspaceId);
        if (workspaceClientSet) {
            workspaceClientSet.delete(clientId);
            if (workspaceClientSet.size === 0) {
                this.workspaceClients.delete(workspaceId);
            }
        }

        // Remove from user clients
        const userClientSet = this.userClients.get(userId);
        if (userClientSet) {
            userClientSet.delete(clientId);
            if (userClientSet.size === 0) {
                this.userClients.delete(userId);
            }
        }

        logger.info('WebSocket client disconnected', { 
            clientId, 
            userId, 
            workspaceId,
            totalClients: this.clients.size 
        });
    }

    // ============================================================================
    // Messaging Methods
    // ============================================================================

    /**
     * Send message to a specific client
     */
    private sendToClient(clientId: string, data: any): boolean {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            client.ws.send(JSON.stringify(data));
            return true;
        } catch (error: any) {
            logger.error('Error sending to client', { clientId, error: error.message });
            return false;
        }
    }

    /**
     * Send message to all clients in a workspace
     */
    public sendToWorkspace(workspaceId: string, data: any): number {
        const clientIds = this.workspaceClients.get(workspaceId);
        if (!clientIds || clientIds.size === 0) {
            logger.debug('No clients in workspace', { workspaceId });
            return 0;
        }

        let sentCount = 0;
        clientIds.forEach((clientId) => {
            if (this.sendToClient(clientId, data)) {
                sentCount++;
            }
        });

        logger.debug('Sent message to workspace', { 
            workspaceId, 
            sentCount, 
            totalInWorkspace: clientIds.size 
        });

        return sentCount;
    }

    /**
     * Send message to all clients of a specific user
     */
    public sendToUser(userId: string, data: any): number {
        const clientIds = this.userClients.get(userId);
        if (!clientIds || clientIds.size === 0) {
            logger.debug('No clients for user', { userId });
            return 0;
        }

        let sentCount = 0;
        clientIds.forEach((clientId) => {
            if (this.sendToClient(clientId, data)) {
                sentCount++;
            }
        });

        logger.debug('Sent message to user', { 
            userId, 
            sentCount, 
            totalForUser: clientIds.size 
        });

        return sentCount;
    }

    /**
     * Broadcast message to ALL connected clients (use sparingly)
     * Kept for backwards compatibility but should be avoided
     */
    public broadcast(data: any): number {
        let sentCount = 0;
        this.clients.forEach((client, clientId) => {
            if (this.sendToClient(clientId, data)) {
                sentCount++;
            }
        });

        logger.debug('Broadcast message to all clients', { 
            sentCount, 
            totalClients: this.clients.size 
        });

        return sentCount;
    }

    // ============================================================================
    // Status Methods
    // ============================================================================

    /**
     * Get count of authenticated connected clients
     */
    public getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Get count of clients in a specific workspace
     */
    public getWorkspaceClientCount(workspaceId: string): number {
        return this.workspaceClients.get(workspaceId)?.size || 0;
    }

    /**
     * Get count of healthy clients (OPEN state)
     */
    public getHealthyClientCount(): number {
        let count = 0;
        this.clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                count++;
            }
        });
        return count;
    }

    /**
     * Get list of active workspace IDs
     */
    public getActiveWorkspaces(): string[] {
        return Array.from(this.workspaceClients.keys());
    }

    /**
     * Check if a workspace has any connected clients
     */
    public hasWorkspaceClients(workspaceId: string): boolean {
        const clients = this.workspaceClients.get(workspaceId);
        return clients !== undefined && clients.size > 0;
    }

    // ============================================================================
    // Cleanup
    // ============================================================================

    /**
     * Close WebSocket server
     */
    public close(): void {
        // Clear all pending auth timeouts
        this.pendingClients.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.pendingClients.clear();

        // Close all client connections
        this.clients.forEach((client) => {
            try {
                client.ws.close(1000, 'Server shutting down');
            } catch (error) {
                // Ignore errors during shutdown
            }
        });

        // Clear all maps
        this.clients.clear();
        this.workspaceClients.clear();
        this.userClients.clear();

        // Close WebSocket server
        if (this.wss) {
            this.wss.close(() => {
                logger.info('WebSocket server closed');
            });
        }
    }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
