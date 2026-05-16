type BaseErrorProps = {
  name: string;
  message?: string;
};

export class BaseError extends Error {
  public readonly isCustomError: boolean = true;

  constructor(props: BaseErrorProps) {
    const { name, message = 'Something went wrong' } = props;

    super(message);

    Object.defineProperty(this, 'name', { value: name || this.constructor.name, enumerable: true });
    Object.defineProperty(this, 'message', { enumerable: true, value: message });
    Object.defineProperty(this, 'stack', { enumerable: true });
  }
}
