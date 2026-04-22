import { Injectable } from '@nestjs/common';

@Injectable()
export class BlackjackService {
  private suits = ['♥', '♦', '♣', '♠'];
  private values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  drawCard() {
    const value = this.values[Math.floor(Math.random() * this.values.length)];
    const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
    return { value, suit, score: this.getCardValue(value) };
  }

  private getCardValue(value: string): number {
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'A') return 11;
    return parseInt(value);
  }

  calculateScore(hand: any[]) {
    let score = hand.reduce((acc, card) => acc + card.score, 0);
    let aces = hand.filter(card => card.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  }
}