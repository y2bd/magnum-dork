export const sfetch: typeof fetch = async (...args: any[]) => {
  await delay();
  return await fetch.call(null, ...args);
};

export const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));
