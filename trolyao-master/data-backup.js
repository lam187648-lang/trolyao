const BACKUP_FORMAT = "trolyao-browser-data";
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

const inventory = document.getElementById("storage-inventory");
const status = document.getElementById("backup-status");
const fileInput = document.getElementById("backup-file");

function readStorage(storage) {
  const entries = Object.create(null);
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null) entries[key] = storage.getItem(key);
  }
  return entries;
}

function renderInventory() {
  const stores = [
    ["localStorage", localStorage],
    ["sessionStorage", sessionStorage]
  ];

  inventory.replaceChildren();
  for (const [name, storage] of stores) {
    const keys = [];
    let bytes = 0;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key === null) continue;
      const value = storage.getItem(key) || "";
      keys.push(key);
      bytes += new Blob([key, value]).size;
    }

    const row = document.createElement("div");
    row.className = "storage-row";
    const label = document.createElement("span");
    label.textContent = `${name}: ${keys.length} khóa`;
    const details = document.createElement("span");
    details.textContent = `${(bytes / 1024).toFixed(1)} KB`;
    row.append(label, details);
    inventory.appendChild(row);
  }
}

function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trolyao-local-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.getElementById("download-backup").addEventListener("click", () => {
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    origin: location.origin,
    localStorage: readStorage(localStorage),
    sessionStorage: readStorage(sessionStorage)
  };
  downloadBackup(backup);
  status.textContent = "Đã tạo tệp sao lưu trên thiết bị này.";
});

document.getElementById("choose-restore").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  fileInput.value = "";
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    status.textContent = "Tệp sao lưu vượt quá giới hạn 25 MB.";
    return;
  }

  try {
    const backup = JSON.parse(await file.text());
    if (
      backup?.format !== BACKUP_FORMAT ||
      backup.version !== BACKUP_VERSION ||
      !backup.localStorage ||
      !backup.sessionStorage ||
      typeof backup.localStorage !== "object" ||
      typeof backup.sessionStorage !== "object" ||
      Array.isArray(backup.localStorage) ||
      Array.isArray(backup.sessionStorage)
    ) {
      throw new Error("Định dạng bản sao lưu không hợp lệ.");
    }

    const storageEntries = [
      [localStorage, backup.localStorage],
      [sessionStorage, backup.sessionStorage]
    ];
    for (const [, entries] of storageEntries) {
      if (Object.values(entries).some((value) => typeof value !== "string")) {
        throw new Error("Bản sao lưu chứa giá trị không hợp lệ.");
      }
    }

    let restored = 0;
    let skipped = 0;
    const inserted = [];
    try {
      for (const [storage, entries] of storageEntries) {
        for (const [key, value] of Object.entries(entries)) {
          if (storage.getItem(key) !== null) {
            skipped += 1;
            continue;
          }
          storage.setItem(key, value);
          inserted.push([storage, key, value]);
          restored += 1;
        }
      }
    } catch (error) {
      let rollbackFailed = false;
      for (const [storage, key, value] of inserted.reverse()) {
        try {
          if (storage.getItem(key) === value) storage.removeItem(key);
        } catch {
          rollbackFailed = true;
        }
      }
      if (rollbackFailed) throw new Error("Khôi phục thất bại và không thể hoàn tất hoàn tác.");
      throw error;
    }

    renderInventory();
    status.textContent = `Đã khôi phục ${restored} khóa còn thiếu; giữ nguyên ${skipped} khóa đang có. Không có khóa nào bị ghi đè.`;
  } catch (error) {
    console.error("Khôi phục bản sao lưu thất bại:", error);
    status.textContent = error instanceof SyntaxError
      ? "Không thể đọc JSON trong tệp sao lưu."
      : error.message || "Tệp sao lưu không hợp lệ.";
  }
});

renderInventory();
