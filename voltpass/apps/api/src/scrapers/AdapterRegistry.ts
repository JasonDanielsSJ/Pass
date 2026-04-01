import { BaseAdapter } from './BaseAdapter';
import { TXTDLRAdapter } from './TXTDLRAdapter';
import { FLDBPRAdapter } from './FLDBPRAdapter';
import { CACSLBAdapter } from './CACSLBAdapter';

const adapters: BaseAdapter[] = [
  new TXTDLRAdapter(),
  new FLDBPRAdapter(),
  new CACSLBAdapter(),
];

export const AdapterRegistry = {
  getAdapter(stateCode: string): BaseAdapter | undefined {
    return adapters.find(a => a.stateCode === stateCode);
  },
  getSupportedStates(): string[] {
    return adapters.map(a => a.stateCode);
  },
};
