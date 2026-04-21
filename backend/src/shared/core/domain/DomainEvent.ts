/**
 * Base struct for all Domain Events in the system.
 */
export interface IDomainEvent {
  /**
   * Thời gian phát sinh sự kiện
   */
  occuredOn: Date;

  /**
   * Tên định danh của sự kiện
   */
  eventName: string;

  /**
   * Phiên bản (dùng để versioning message sau này)
   */
  eventVersion: number;
}

export abstract class DomainEvent implements IDomainEvent {
  public readonly occuredOn: Date;
  public readonly eventName: string;
  public readonly eventVersion: number;

  constructor() {
    this.occuredOn = new Date();
    this.eventName = this.constructor.name;
    this.eventVersion = 1;
  }
}
