import { DeviceWorkspaceView } from 'src/sections/devices/view/device-workspace-view';

export const metadata = {
  title: 'Dashboard: Devices',
};

export default function Page() {
  return <DeviceWorkspaceView mode="list" />;
}
