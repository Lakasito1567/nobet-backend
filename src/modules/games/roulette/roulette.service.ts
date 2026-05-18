import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class RouletteService implements OnModuleInit {
  private phase: 'BETTING' | 'SPINNING' | 'PAYING' = 'BETTING';
  private timer = 15;
  private history: { number: number; color: string }[] = [];
  
  // Usamos un Subject para avisar al Gateway cuando el estado cambie
  public stateEmitter = new Subject<any>();

  onModuleInit() {
    this.startGameLoop();
  }

  private startGameLoop() {
    setInterval(() => {
      this.timer--;

      if (this.timer <= 0) {
        this.nextPhase();
      }

      // Emitimos el estado actual cada segundo a todos
      this.stateEmitter.next(this.getGameState());
    }, 1000);
  }

  private nextPhase() {
    if (this.phase === 'BETTING') {
      this.phase = 'SPINNING';
      this.timer = 5; // Tiempo de animación de la ruleta
      this.generateWinningNumber();
    } else if (this.phase === 'SPINNING') {
      this.phase = 'PAYING';
      this.timer = 3; // Tiempo para mostrar quién ganó
    } else {
      this.phase = 'BETTING';
      this.timer = 15; // Reinicia tiempo de apuestas
    }
  }

  private generateWinningNumber() {
    const num = Math.floor(Math.random() * 37);
    const color = num === 0 ? 'green' : [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'red' : 'black';
    
    this.history.unshift({ number: num, color });
    if (this.history.length > 10) this.history.pop();
  }

  getGameState() {
    return {
      phase: this.phase,
      timer: this.timer,
      history: this.history,
      lastWinningNumber: this.history[0] || null,
    };
  }
}