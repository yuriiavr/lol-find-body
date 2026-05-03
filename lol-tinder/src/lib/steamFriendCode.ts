import { createHash } from 'crypto'

const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const RALNUM: Record<string, bigint> = Object.fromEntries(
  ALNUM.split('').map((c, i) => [c, BigInt(i)])
)

const B0   = BigInt(0)
const B1   = BigInt(1)
const B4   = BigInt(4)
const B5   = BigInt(5)
const B8   = BigInt(8)
const B16  = BigInt(16)
const B28  = BigInt(28)
const B31  = BigInt(31)
const B32  = BigInt(32)
const B256 = BigInt(256)

const MASK_4   = BigInt('0xF')
const MASK_5   = BigInt('0x1F')
const MASK_32  = BigInt('0xFFFFFFFF')
const MASK_64  = BigInt('0xFFFFFFFFFFFFFFFF')
const CSGO_XOR = BigInt('0x4353474F00000000')
const DEFAULT_STEAM_ID = BigInt('0x110000100000000')

// ── Byte helpers ──────────────────────────────────────────────────────────────

function toLittleEndian(n: bigint): Uint8Array {
  const result = new Uint8Array(8)
  for (let i = 0; n > B0; i++) {
    result[i] = Number(n % B256)
    n = n / B256
  }
  return result
}

function fromLittleEndian(bytes: Uint8Array | Buffer | number[]): bigint {
  let result = B0
  let base   = B1
  for (const byte of bytes) {
    result += base * BigInt(byte)
    base   *= B256
  }
  return result
}

function fromBigEndian(bytes: Uint8Array | Buffer): bigint {
  return fromLittleEndian([...bytes].reverse())
}

// ── Base-32 encode / decode ───────────────────────────────────────────────────

function b32encode(input: bigint): string {
  input = fromBigEndian(toLittleEndian(input))
  let res = ''
  for (let i = 0; i < 13; i++) {
    if (i === 4 || i === 9) res += '-'
    res += ALNUM[Number(input & MASK_5)]
    input >>= B5
  }
  return res
}

function b32decode(input: string): bigint {
  let res = B0
  for (let i = 0; i < 13; i++) {
    if (i === 4 || i === 9) input = input.slice(1)
    res |= RALNUM[input[0]] << (B5 * BigInt(i))
    input = input.slice(1)
  }
  return fromBigEndian(toLittleEndian(res))
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function hashSteamId(id: bigint): bigint {
  const accountId      = id & MASK_32
  const strangeSteamId = accountId | CSGO_XOR
  const bytes          = toLittleEndian(strangeSteamId)
  const hash           = createHash('md5').update(Buffer.from(bytes)).digest()
  return fromLittleEndian(hash.slice(0, 4))
}

function makeU64(hi: bigint, lo: bigint): bigint {
  return ((hi << B32) | lo) & MASK_64
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Converts a SteamID64 to a CS2 friend code.
 * @example steamIdToFriendCode('76561197960287930') // "SUCVS-FADA"
 */
export function steamIdToFriendCode(steamId64: string | bigint): string {
  let steamid = BigInt(steamId64)
  const h     = hashSteamId(steamid)

  let r = B0
  for (let i = 0; i < 8; i++) {
    const idNibble   = steamid & MASK_4
    steamid        >>= B4

    const hashNibble = (h >> BigInt(i)) & B1
    const a          = (r << B4) | idNibble

    r = makeU64(r >> B28, a)
    r = makeU64(r >> B31, (a << B1) | hashNibble)
  }

  let res = b32encode(r)
  if (res.slice(0, 4) === 'AAAA') res = res.slice(5)
  return res
}

/**
 * Converts a CS2 friend code back to a SteamID64 string.
 * @example friendCodeToSteamId('SUCVS-FADA') // "76561197960287930"
 */
export function friendCodeToSteamId(code: string): string {
  let friendCode = code.toUpperCase().trim()
  if (friendCode.length !== 10) return ''
  if (friendCode.slice(0, 5) !== 'AAAA-') friendCode = 'AAAA-' + friendCode

  let val = b32decode(friendCode)
  let id  = B0

  for (let i = 0; i < 8; i++) {
    val  >>= B1
    const idNibble = val & MASK_4
    val  >>= B4
    id    = (id << B4) | idNibble
  }

  return (id | DEFAULT_STEAM_ID).toString()
}