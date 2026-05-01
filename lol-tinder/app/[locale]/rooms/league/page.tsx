import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';

const config: GameRoomsConfig = {
  gameType: 'lol',
  channelKey: 'public:lol-rooms',
  modes: ['ALL', 'FLEX', 'NORMAL', 'ARAM', 'ARENA', 'QUICK PLAY', 'CUSTOM'],
  rankOrder: ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
  modalRanks: ['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER+'],
};

export default function LeagueRooms() {
  return <RoomsPage config={config} />;
}