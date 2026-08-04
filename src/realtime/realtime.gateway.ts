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
import { JwtService } from '@nestjs/jwt';
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

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    const auth = client.handshake.auth?.token || client.handshake.headers?.authorization;
    let token = '';
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    } else {
      token = auth || '';
    }

    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'super-secret' });
      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id} as user ${payload.sub}`);
    } catch {
      this.logger.error(`Unauthorized client disconnected: ${client.id}`);
      client.disconnect();
    }
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
