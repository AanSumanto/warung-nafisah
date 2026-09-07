import type { Identifier } from '../common/Identifier.js';
import type { LoyaltyProgram } from './LoyaltyProgram.js';

export interface ILoyaltyProgramRepository {
  save(program: LoyaltyProgram): Promise<LoyaltyProgram>;
  findById(id: Identifier): Promise<LoyaltyProgram | null>;
  findByProgramCode(programCode: string): Promise<LoyaltyProgram | null>;
}
