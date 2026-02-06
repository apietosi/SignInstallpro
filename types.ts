export interface Assignment {
  name: string;
  builder: string;
  community: string;
}

export interface LogItem {
  id: string;
  timestamp: string;
  name: string;
  builder: string;
  community: string;
  action: string;
  item: string;
  quantity: number;
}

export interface CsvRow {
  [key: string]: string;
}

export enum AppStep {
  SELECT_NAME = 0,
  SELECT_BUILDER = 1,
  SELECT_COMMUNITY = 2,
  LOG_WORK = 3,
  SUMMARY = 4,
  ADMIN = 5
}