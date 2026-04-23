import { Injectable } from '@nestjs/common';

export interface Card {
  value: string;
  suit: string;
  score: number;
}

@Injectable()
export class BlackjackService {
  private suits = ['♥', '♦', '♣', '♠'];
  private values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  drawCard(): Card { // Añadimos el tipo de retorno aquí también
    const value = this.values[Math.floor(Math.random() * this.values.length)];
    const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
    return { value, suit, score: this.getCardValue(value) };
  }

  private getCardValue(value: string): number {
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'A') return 11;
    return parseInt(value);
  }

  calculateScore(hand: Card[]) {
    let score = hand.reduce((acc, card) => acc + card.score, 0);
    let aces = hand.filter(card => card.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  }

  playDealerHand() {
    const hand: Card[] = [];
    let score = 0;

    while (score < 17) {
      const card = this.drawCard();
      hand.push(card);
      score = this.calculateScore(hand);
    }

    return { hand, score };
  }
}