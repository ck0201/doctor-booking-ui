import { LookupItem } from './lookup-item.model';

export interface State extends LookupItem {}

export interface City extends LookupItem {
  readonly districtId: number;
}

export interface District extends LookupItem {
  readonly stateId: number;
  readonly cities: readonly City[];
}
