import type { QuoteAttachment } from "@/lib/quote";

export const quoteAttachmentAccept = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const maxQuoteAttachmentSize = 10 * 1024 * 1024;

const attachmentDbName = "nicoroof.quoteAttachments.v1";
const attachmentStoreName = "attachments";
const acceptedAttachmentTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

type AttachmentRecord = QuoteAttachment & {
  file: Blob;
  quoteId: string;
};

function createAttachmentId(quoteId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${quoteId}-${crypto.randomUUID()}`;
  }

  return `${quoteId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function openAttachmentDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Stocarea fisierelor nu este disponibila in acest browser."));
      return;
    }

    const request = indexedDB.open(attachmentDbName, 1);

    request.onerror = () => reject(new Error("Nu am putut deschide stocarea fisierelor."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(attachmentStoreName)) {
        const store = db.createObjectStore(attachmentStoreName, { keyPath: "id" });
        store.createIndex("quoteId", "quoteId");
      }
    };
  });
}

export function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024)).toLocaleString("ro-RO")} KB`;
}

export function validateQuoteAttachment(file: File) {
  if (!acceptedAttachmentTypes.has(file.type)) {
    return "FiÈ™iere acceptate: PDF, JPG È™i PNG.";
  }

  if (file.size > maxQuoteAttachmentSize) {
    return "Dimensiunea maximÄƒ pentru un fiÈ™ier este 10MB.";
  }

  return null;
}

export function createQuoteAttachment(file: File, quoteId: string): QuoteAttachment {
  return {
    createdAt: new Date().toISOString(),
    id: createAttachmentId(quoteId),
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export async function saveQuoteAttachmentFiles(quoteId: string, attachments: Array<{ file: File; metadata: QuoteAttachment }>) {
  if (attachments.length === 0) {
    return;
  }

  const db = await openAttachmentDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(attachmentStoreName, "readwrite");
      const store = transaction.objectStore(attachmentStoreName);

      for (const attachment of attachments) {
        const record: AttachmentRecord = {
          ...attachment.metadata,
          file: attachment.file,
          quoteId,
        };
        store.put(record);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Nu am putut salva ataÈ™amentele."));
      transaction.onabort = () => reject(new Error("Salvarea ataÈ™amentelor a fost opritÄƒ."));
    });
  } finally {
    db.close();
  }
}

export async function getQuoteAttachmentFile(id: string) {
  const db = await openAttachmentDb();

  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(attachmentStoreName, "readonly").objectStore(attachmentStoreName).get(id);

      request.onerror = () => reject(new Error("Nu am putut citi ataÈ™amentul."));
      request.onsuccess = () => {
        const record = request.result as AttachmentRecord | undefined;
        resolve(record?.file ?? null);
      };
    });
  } finally {
    db.close();
  }
}
