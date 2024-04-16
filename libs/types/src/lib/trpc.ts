import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { TRPCRouter } from '@couture-next/api-connector';

export type TRPCRouterInput = inferRouterInputs<TRPCRouter>;
export type TRPCRouterOutput = inferRouterOutputs<TRPCRouter>;
