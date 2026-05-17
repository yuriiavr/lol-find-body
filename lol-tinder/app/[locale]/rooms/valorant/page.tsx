import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';
import { VALORANT_ROOM_MODES } from '@/src/constants/queues';
import { VALORANT_ROOM_RANK_ORDER, VALORANT_ROOM_MODAL_RANKS } from '@/src/constants/ranks';

const config: GameRoomsConfig = {
  gameType: 'valorant',
  channelKey: 'public:valorant-rooms',
  modes: VALORANT_ROOM_MODES,
  rankOrder: VALORANT_ROOM_RANK_ORDER,
  modalRanks: VALORANT_ROOM_MODAL_RANKS,
};

export default function ValorantRooms() {
  return <RoomsPage config={config} />;
}
