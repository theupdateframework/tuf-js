export const dateToJSONFormat = (date: Date): string => {
  console.log(
    new Date('2021-12-18T13:28:12.990-06:00'),
    date.toISOString(),
    date.getTime()
  );
  return date.toISOString();
};
