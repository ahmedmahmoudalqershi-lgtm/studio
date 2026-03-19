import { config } from 'dotenv';
config();

import '@/ai/flows/generate-maintenance-description.ts';
import '@/ai/flows/analyze-bids.ts';
import '@/ai/flows/troubleshoot-device.ts';
