import * as SQLite from "expo-sqlite";

export type PinRow = {
  id: string;
  lat: number;
  lng: number;
  createdAt: number;
  memo: string | null;
  photoUri: string | null;
  region1: string | null;
  region2: string | null;
  region3: string | null;
  formattedAddress: string | null;
};

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("memorymap.db");
  }
  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pins (
      id TEXT PRIMARY KEY NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      createdAt INTEGER NOT NULL,
      memo TEXT,
      photoUri TEXT,
      region1 TEXT,
      region2 TEXT,
      region3 TEXT,
      formattedAddress TEXT
    );
  `);

  // 컬럼 추가 마이그레이션 (이미 존재하면 에러가 발생하므로 try-catch로 무시)
  const migrations = [
    `ALTER TABLE pins ADD COLUMN region1 TEXT;`,
    `ALTER TABLE pins ADD COLUMN region2 TEXT;`,
    `ALTER TABLE pins ADD COLUMN region3 TEXT;`,
    `ALTER TABLE pins ADD COLUMN formattedAddress TEXT;`,
  ];

  for (const sql of migrations) {
    try {
      await database.runAsync(sql);
    } catch (e) {
      // 컬럼이 이미 존재함 -> 무시
    }
  }
}

export async function fetchPins(): Promise<PinRow[]> {
  const database = await getDb();
  return await database.getAllAsync<PinRow>(`SELECT * FROM pins ORDER BY createdAt DESC;`);
}

export async function insertPin(pin: PinRow): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO pins (id, lat, lng, createdAt, memo, photoUri, region1, region2, region3, formattedAddress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      pin.id,
      pin.lat,
      pin.lng,
      pin.createdAt,
      pin.memo,
      pin.photoUri,
      pin.region1,
      pin.region2,
      pin.region3,
      pin.formattedAddress,
    ]
  );
}

export async function updatePinRow(id: string, patch: Partial<PinRow>): Promise<void> {
  const keys = Object.keys(patch) as (keyof PinRow)[];
  if (keys.length === 0) return;

  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (patch[k] as any));
  values.push(id);

  const database = await getDb();
  await database.runAsync(`UPDATE pins SET ${setSql} WHERE id = ?;`, values);
}

export async function deleteAllPins(): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM pins;`);
}
