type BroadcastOptions = {
  binary?: boolean;
};

export type PublishToTopicProps = {
  topic: string;
  payload: unknown;
  options?: BroadcastOptions;
};
