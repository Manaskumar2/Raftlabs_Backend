import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OrderStatus } from '@prisma/client';

interface StatusUpdatePayload {
  orderId: string;
  status: OrderStatus;
  updatedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('order.join')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): { event: string; data: { orderId: string; message: string } } {
    const room = `order:${data.orderId}`;
    void client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return {
      event: 'order.joined',
      data: {
        orderId: data.orderId,
        message: `Subscribed to order ${data.orderId} updates`,
      },
    };
  }

  @SubscribeMessage('order.leave')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ): void {
    const room = `order:${data.orderId}`;
    void client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  emitStatusUpdate(orderId: string, payload: StatusUpdatePayload): void {
    const room = `order:${orderId}`;
    this.server.to(room).emit('order.status.updated', payload);
    this.logger.log(`Emitted status update to room ${room}: ${payload.status}`);
  }
}
