import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      void client.join(userId);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } else {
      this.logger.log(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody()
    payload: {
      senderId: string;
      receiverId: string;
      content: string;
    },
  ) {
    this.logger.log(
      `Received message from ${payload.senderId} to ${payload.receiverId}: ${payload.content}`,
    );

    // Phát lại tin nhắn cho user cụ thể thông qua room receiverId
    this.server.to(payload.receiverId).emit('newMessage', payload);

    // Ghi tin nhắn vào database ở đây (MongoDB/Postgres partition)
    return { status: 'Message sent' };
  }
}
