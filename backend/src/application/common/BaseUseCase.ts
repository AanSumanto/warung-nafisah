import type { Result } from '../../domain/common/Result.js';

export abstract class BaseUseCase<TInput, TOutput> {
  abstract execute(input: TInput): Promise<TOutput>;
}

export abstract class BaseUseCaseWithResult<TInput, TOutput, TError = Error> {
  abstract execute(input: TInput): Promise<Result<TOutput, TError>>;
}

export abstract class BaseCommandUseCase<TCommand, TResult = void> {
  abstract execute(command: TCommand): Promise<TResult>;
}

export abstract class BaseQueryUseCase<TQuery, TResult> {
  abstract execute(query: TQuery): Promise<TResult>;
}
