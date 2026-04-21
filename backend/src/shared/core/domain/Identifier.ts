export class Identifier<T> {
  constructor(private value: T) {
    this.value = value;
  }

  public equals(id?: Identifier<T>): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    if (!(id instanceof this.constructor)) {
      return false;
    }
    return id.toValue() === this.value;
  }

  public toString(): string {
    return String(this.value);
  }

  public toValue(): T {
    return this.value;
  }
}

export class UniqueEntityID extends Identifier<string | number> {
  constructor(id?: string | number) {
    super(id ? id : crypto.randomUUID());
  }
}
