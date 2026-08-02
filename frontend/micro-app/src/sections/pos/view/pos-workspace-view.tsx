'use client';

import { PosRegister } from '../components/pos-register';

type Props = {
  mode?: string;
  shopId?: string;
  deliveryId?: string;
  orderId?: string;
  [key: string]: any;
};

export function PosWorkspaceView({ mode, shopId, ...other }: Props) {
  return <PosRegister mode={mode} shopId={shopId} {...other} />;
}
