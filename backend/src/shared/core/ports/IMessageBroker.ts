import { IDomainEvent } from '../domain/DomainEvent';
import { ResultAsync } from 'neverthrow';

export interface IMessageBroker {
  /**
   * Phát đi một hoặc nhiều sự kiện vào queue/event bus.
   */
  publish(event: IDomainEvent | IDomainEvent[]): ResultAsync<boolean, Error>;
}
