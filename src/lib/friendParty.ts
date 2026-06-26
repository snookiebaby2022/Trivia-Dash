import AsyncStorage from '@react-native-async-storage/async-storage';

import { dateSeed } from '../data/questions';
import type { FriendPartyRoom } from '../types';

const ROOMS_KEY = 'td.friend.rooms.v1';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateFriendCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function loadRooms(): Promise<Record<string, FriendPartyRoom>> {
  try {
    const raw = await AsyncStorage.getItem(ROOMS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FriendPartyRoom>) : {};
  } catch {
    return {};
  }
}

async function saveRooms(rooms: Record<string, FriendPartyRoom>): Promise<void> {
  const pruned = Object.fromEntries(
    Object.entries(rooms).filter(([, r]) => Date.now() - r.createdAt < 4 * 3600000)
  );
  await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(pruned));
}

export async function createFriendRoom(
  hostId: string,
  hostName: string,
  mode: 'party' | 'livehost',
  maxPlayers = 8
): Promise<FriendPartyRoom> {
  const rooms = await loadRooms();
  let code = generateFriendCode();
  while (rooms[code]) code = generateFriendCode();
  const room: FriendPartyRoom = {
    code,
    hostId,
    hostName,
    mode,
    questionSeed: dateSeed(`friend-${code}-${Date.now()}`),
    maxPlayers,
    players: [{ id: hostId, name: hostName }],
    createdAt: Date.now(),
  };
  rooms[code] = room;
  await saveRooms(rooms);
  return room;
}

export async function joinFriendRoom(
  code: string,
  playerId: string,
  playerName: string
): Promise<FriendPartyRoom | null> {
  const rooms = await loadRooms();
  const room = rooms[code.toUpperCase()];
  if (!room) return null;
  if (room.players.length >= room.maxPlayers) return null;
  if (!room.players.some((p) => p.id === playerId)) {
    room.players.push({ id: playerId, name: playerName });
    rooms[code.toUpperCase()] = room;
    await saveRooms(rooms);
  }
  return room;
}

export async function getFriendRoom(code: string): Promise<FriendPartyRoom | null> {
  const rooms = await loadRooms();
  return rooms[code.toUpperCase()] ?? null;
}
