import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';
import { TFT_ROOM_MODES } from '@/src/constants/queues';
import { TFT_ROOM_RANK_ORDER, TFT_ROOM_MODAL_RANKS } from '@/src/constants/ranks';

const config: GameRoomsConfig = {
  gameType: 'tft',
  channelKey: 'public:tft-rooms',
  modes: TFT_ROOM_MODES,
  rankOrder: TFT_ROOM_RANK_ORDER,
  modalRanks: TFT_ROOM_MODAL_RANKS,
};

export default function TFTRooms() {
  return <RoomsPage config={config} />;
}
