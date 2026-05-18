export interface IObserver<TEvent> {
  update(event: TEvent): void | Promise<void>;
}

export interface ISubject<TEvent> {
  subscribe(observer: IObserver<TEvent>): void;
  unsubscribe(observer: IObserver<TEvent>): void;
  notify(event: TEvent): void | Promise<void>;
}
