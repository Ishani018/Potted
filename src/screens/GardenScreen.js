import { useGame } from '../context/GameContext';
import Room1Screen from './Room1Screen';
import Room2Screen from './Room2Screen';
import Room3Screen from './Room3Screen';

export default function GardenScreen({ navigation }) {
  const { state } = useGame();
  const room = state.player.currentRoom;

  if (room === 2) return <Room2Screen navigation={navigation} />;
  if (room === 3) return <Room3Screen navigation={navigation} />;
  return <Room1Screen navigation={navigation} />;
}
