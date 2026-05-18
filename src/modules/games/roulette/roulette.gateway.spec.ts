import { Test, TestingModule } from '@nestjs/testing';
import { RouletteGateway } from './roulette.gateway';

describe('RouletteGateway', () => {
  let gateway: RouletteGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouletteGateway],
    }).compile();

    gateway = module.get<RouletteGateway>(RouletteGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
