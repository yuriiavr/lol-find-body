import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';

const config: GameRoomsConfig = {
  gameType: 'tft',
  channelKey: 'public:tft-rooms',
  modes: ['ALL', 'RANKED', 'NORMAL', 'HYPER ROLL', 'DOUBLE UP'],
  rankOrder: ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
  modalRanks: ['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER+'],
};

export default function TFTRooms() {
  return <RoomsPage config={config} />;
}