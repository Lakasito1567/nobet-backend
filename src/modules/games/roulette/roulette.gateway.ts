import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RouletteService } from './roulette.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RouletteGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly rouletteService: RouletteService) {
    // Escuchamos los cambios del servicio y los enviamos a todos los clientes
    this.rouletteService.stateEmitter.subscribe((state) => {
      this.server.emit('rouletteState', state);
    });
  }

  handleConnection(client: any) {
    // Cuando alguien se conecta, le enviamos el estado actual de inmediato
    client.emit('rouletteState', this.rouletteService.getGameState());
  }
}