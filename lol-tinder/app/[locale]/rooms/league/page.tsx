import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';
import { LOL_ROOM_MODES } from '@/src/constants/queues';
import { LOL_ROOM_RANK_ORDER, LOL_ROOM_MODAL_RANKS } from '@/src/constants/ranks';

const config: GameRoomsConfig = {
  gameType: 'lol',
  channelKey: 'public:lol-rooms',
  modes: LOL_ROOM_MODES,
  rankOrder: LOL_ROOM_RANK_ORDER,
  modalRanks: LOL_ROOM_MODAL_RANKS,
};

export default function LeagueRooms() {
  return <RoomsPage config={config} />;
}
