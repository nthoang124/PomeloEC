import { ResultAsync } from 'neverthrow';
import { BusinessException } from '../exceptions/BusinessException';

export interface IRepository<TEntity> {
  save(entity: TEntity): ResultAsync<TEntity, BusinessException | Error>;
  findById(
    id: string | number,
  ): ResultAsync<TEntity | null, BusinessException | Error>;
  delete(id: string | number): ResultAsync<boolean, BusinessException | Error>;
}
