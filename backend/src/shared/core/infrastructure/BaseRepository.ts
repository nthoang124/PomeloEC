import { AggregateRoot } from '../domain/AggregateRoot';
import { IMessageBroker } from '../ports/IMessageBroker';

export abstract class BaseRepository<T extends AggregateRoot<unknown>> {
  constructor(protected readonly messageBroker: IMessageBroker) {}

  /**
   * Phương thức hook tự động dispatch sự kiện sau khi lưu DB.
   * Góp phần giải quyết câu hỏi mở của Technical Architect.
   */
  protected async publishEvents(aggregate: T): Promise<void> {
    const events = aggregate.domainEvents;
    if (events && events.length > 0) {
      await this.messageBroker.publish(events);
      aggregate.clearEvents();
    }
  }

  // Lớp con (ví dụ: UserRepository) sẽ triển khai save() thực sự ghi vào Prisma
  // Sau cùng, họ sẽ gọi await this.publishEvents(aggregate);
}
