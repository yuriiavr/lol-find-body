import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';
import { CS2_ROOM_MODES } from '@/src/constants/queues';
import { CS2_ROOM_RANK_ORDER, CS2_ROOM_MODAL_RANKS } from '@/src/constants/ranks';
import { ROOM_CS2_REGIONS } from '@/src/constants/regions';

const config: GameRoomsConfig = {
  gameType: 'cs2',
  channelKey: 'public:cs2-rooms',
  modes: CS2_ROOM_MODES,
  rankOrder: CS2_ROOM_RANK_ORDER,
  modalRanks: CS2_ROOM_MODAL_RANKS,
  regions: ROOM_CS2_REGIONS,
};

export default function CS2Rooms() {
  return <RoomsPage config={config} />;
}
