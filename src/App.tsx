import { BroadcastFrame } from './ui/BroadcastFrame';
import { DreamScene } from './features/dream/DreamScene';
import './ui/theme.css';

export default function App() {
  return (
    <BroadcastFrame>
      <DreamScene />
    </BroadcastFrame>
  );
}
