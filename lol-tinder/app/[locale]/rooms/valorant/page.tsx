import RoomsPage, { GameRoomsConfig } from '@/app/[locale]/rooms/components/RoomsPage';

const config: GameRoomsConfig = {
  gameType: 'valorant',
  channelKey: 'public:valorant-rooms',
  modes: ['ALL', 'COMPETITIVE', 'UNRATED', 'SWIFPLAY', 'SPIKE RUSH', 'DEATHMATCH', 'PREMIER'],
  rankOrder: ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT'],
  modalRanks: ['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT'],
};

export default function ValorantRooms() {
  return <RoomsPage config={config} />;
}