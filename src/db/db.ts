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

export type PhotoRow = {
  id: number;
  pinId: string;
  uri: string;
  createdAt: number;
};

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
    CREATE TABLE IF NOT EXISTS pin_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pinId TEXT NOT NULL,
      uri TEXT NOT NULL,
      createdAt INTEGER NOT NULL
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

  // 데이터 마이그레이션: pins.photoUri -> pin_photos 로 이동
  // (한 번 실행되고 나면 pins.photoUri는 NULL이 되므로 중복 실행 방지됨)
  try {
    const oldPhotos = await database.getAllAsync<PinRow>(`SELECT id, photoUri FROM pins WHERE photoUri IS NOT NULL AND photoUri != '';`);
    for (const row of oldPhotos) {
      if (row.photoUri) {
        await database.runAsync(
          `INSERT INTO pin_photos (pinId, uri, createdAt) VALUES (?, ?, ?);`,
          [row.id, row.photoUri, Date.now()]
        );
        await database.runAsync(`UPDATE pins SET photoUri = NULL WHERE id = ?;`, [row.id]);
      }
    }
  } catch (e) {
    console.log("Migration failed (photoUri -> pin_photos):", e);
  }
}

export async function fetchAllPhotos(): Promise<PhotoRow[]> {
  const database = await getDb();
  return await database.getAllAsync<PhotoRow>(`SELECT * FROM pin_photos ORDER BY createdAt ASC;`);
}

export async function insertPhoto(pinId: string, uri: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO pin_photos (pinId, uri, createdAt) VALUES (?, ?, ?);`,
    [pinId, uri, Date.now()]
  );
}

export async function deletePhoto(uri: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM pin_photos WHERE uri = ?;`, [uri]);
}

export async function deletePhotosByPin(pinId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(`DELETE FROM pin_photos WHERE pinId = ?;`, [pinId]);
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
  await database.runAsync(`DELETE FROM user_version;`); // (예시)
  await database.runAsync(`DELETE FROM pins;`);
  await database.runAsync(`DELETE FROM pin_photos;`);
}
