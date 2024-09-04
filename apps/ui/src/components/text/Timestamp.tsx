import { formatInTimeZone } from 'date-fns-tz';
import { FC } from 'react';

interface TimestampProps {
  date: Date;
}
export const Timestamp: FC<TimestampProps> = ({ date }) => {
  return <span>{formatInTimeZone(date, 'America/Chicago', 'PP p')}</span>;
};
