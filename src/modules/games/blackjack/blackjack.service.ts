import { Injectable, BadRequestException } from '@nestjs/common';

export interface Card {
  value: string;
  suit: string;
  score: number;
}

interface GameState {
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
  status: 'playing' | 'won' | 'lost' | 'draw';
}

@Injectable()
export class BlackjackService {
  private suits = ['♥', '♦', '♣', '♠'];
  private values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  // Almacén temporal de partidas en memoria
  private activeGames = new Map<number, GameState>();

  private drawCard(): Card {
    const value = this.values[Math.floor(Math.random() * this.values.length)];
    const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
    return { value, suit, score: this.getCardValue(value) };
  }

  private getCardValue(value: string): number {
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'A') return 11;
    return parseInt(value);
  }

  private calculateScore(hand: Card[]): number {
    let score = hand.reduce((acc, card) => acc + card.score, 0);
    let aces = hand.filter(card => card.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  }

  async start(userId: number, bet: number) {
    // Si ya existe una partida, la sobreescribimos (reinicia el juego)
    const playerHand = [this.drawCard(), this.drawCard()];
    const dealerHand = [this.drawCard()]; // Una carta visible

    const gameState: GameState = {
      playerHand,
      dealerHand,
      bet: Number(bet),
      status: 'playing',
    };

    this.activeGames.set(userId, gameState);

    // Si saca 21 natural (Blackjack)
    if (this.calculateScore(playerHand) === 21) {
      return this.stand(userId); 
    }

    return this.formatResponse(gameState);
  }

  async hit(userId: number) {
    const game = this.activeGames.get(userId);
    if (!game) throw new BadRequestException('No hay partida activa. Inicia una nueva apuesta.');

    game.playerHand.push(this.drawCard());
    const score = this.calculateScore(game.playerHand);

    if (score > 21) {
      game.status = 'lost';
      const response = this.formatResponse(game);
      this.activeGames.delete(userId); // Limpiamos la memoria
      return { ...response, message: '¡Te has pasado! Pierdes la apuesta.' };
    }

    return this.formatResponse(game);
  }

  async stand(userId: number) {
    const game = this.activeGames.get(userId);
    if (!game) throw new BadRequestException('No hay partida activa.');

    // Lógica del Crupier: Pide con 16 o menos, se planta con 17 o más
    while (this.calculateScore(game.dealerHand) < 17) {
      game.dealerHand.push(this.drawCard());
    }

    const playerScore = this.calculateScore(game.playerHand);
    const dealerScore = this.calculateScore(game.dealerHand);

    if (dealerScore > 21) {
      game.status = 'won'; // El crupier se pasó
    } else if (playerScore > dealerScore) {
      game.status = 'won';
    } else if (dealerScore > playerScore) {
      game.status = 'lost';
    } else {
      game.status = 'draw';
    }

    const response = this.formatResponse(game);
    this.activeGames.delete(userId); // Limpiamos la memoria
    return response;
  }

  private formatResponse(game: GameState) {
    const pScore = this.calculateScore(game.playerHand);
    const dScore = this.calculateScore(game.dealerHand);
    
    let message = '¿Deseas pedir carta (Hit) o plantarte (Stand)?';
    
    if (game.status === 'won') message = `¡Victoria! Se han acreditado ${game.bet * 2} monedas.`;
    if (game.status === 'lost') message = 'La casa gana. Suerte la próxima vez.';
    if (game.status === 'draw') message = 'Empate técnico. Se devuelve la apuesta.';

    return {
      status: game.status,
      playerHand: game.playerHand,
      dealerHand: game.dealerHand,
      playerScore: pScore,
      dealerScore: dScore,
      bet: Number(game.bet), // CRUCIAL: El controlador necesita este valor para pagar
      message,
      win: game.status === 'won',
      draw: game.status === 'draw'
    };
  }
}