import crypto from "crypto";

// AES-256-GCM encryption cho các secret nhạy cảm (API key người dùng) lưu trong DB.
// Định dạng ciphertext: base64(iv):base64(authTag):base64(data)

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // 96-bit nonce khuyến nghị cho GCM

let cachedKey: Buffer | null = null;

/**
 * Lấy khóa 32-byte. Ưu tiên ENCRYPTION_KEY (hex 64 ký tự hoặc base64 32-byte).
 * Nếu thiếu, derive từ NEXTAUTH_SECRET bằng scrypt để dev local không vỡ.
 */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (raw) {
    // hex 64 ký tự
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      cachedKey = Buffer.from(raw, "hex");
      return cachedKey;
    }
    // base64 -> phải ra đúng 32 byte
    try {
      const buf = Buffer.from(raw, "base64");
      if (buf.length === 32) {
        cachedKey = buf;
        return cachedKey;
      }
    } catch {
      // bỏ qua, rơi xuống derive
    }
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Thiếu ENCRYPTION_KEY và NEXTAUTH_SECRET — không thể mã hóa API key."
    );
  }
  // Derive ổn định 32-byte từ NEXTAUTH_SECRET
  cachedKey = crypto.scryptSync(secret, "pathai-ai-credential", 32);
  return cachedKey;
}

/** Mã hóa plaintext -> chuỗi lưu DB. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/** Giải mã chuỗi từ DB -> plaintext. Throw nếu sai định dạng hoặc key. */
export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Ciphertext không hợp lệ.");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

/** Che API key để hiển thị cho client (không lộ giá trị thật). */
export function maskSecret(plain: string): string {
  if (plain.length <= 8) return "••••";
  return `${plain.slice(0, 4)}••••${plain.slice(-4)}`;
}
