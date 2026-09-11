const fs = require('fs');
const path = require('path');
const os = require('os');

const GEMINI_HOME = path.join(os.homedir(), '.gemini');

const CONVERSATION_DIRS = [
  path.join(GEMINI_HOME, 'antigravity-ide', 'conversations'),
  path.join(GEMINI_HOME, 'antigravity', 'conversations'),
  path.join(GEMINI_HOME, 'antigravity-cli', 'conversations'),
];

const BRAIN_DIRS = [
  path.join(GEMINI_HOME, 'antigravity-ide', 'brain'),
  path.join(GEMINI_HOME, 'antigravity', 'brain'),
];

/**
 * Calculates file/directory size safely
 */
function getPathSize(targetPath) {
  let size = 0;
  if (!fs.existsSync(targetPath)) return 0;
  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(targetPath);
      for (const f of files) {
        size += getPathSize(path.join(targetPath, f));
      }
    } else {
      size += stat.size;
    }
  } catch (e) {}
  return size;
}

/**
 * Format bytes to human readable format (MB, KB)
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Deletes all files and brain folders associated with a single session ID
 * @param {string} sessionId full UUID of the session
 * @returns {{ success: boolean, freedBytes: number, freedFormatted: string, deletedFiles: string[] }}
 */
function deleteSessionFiles(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return { success: false, freedBytes: 0, freedFormatted: '0 B', deletedFiles: [] };
  }

  const cleanId = sessionId.trim().toLowerCase();
  let totalFreed = 0;
  const deletedFiles = [];

  // 1. Delete conversation databases (*.db, *.db-wal, *.db-shm)
  for (const dir of CONVERSATION_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const filePatterns = [
      `${cleanId}.db`,
      `${cleanId}.db-wal`,
      `${cleanId}.db-shm`,
    ];

    for (const f of filePatterns) {
      const p = path.join(dir, f);
      if (fs.existsSync(p)) {
        try {
          const sz = getPathSize(p);
          fs.unlinkSync(p);
          totalFreed += sz;
          deletedFiles.push(p);
        } catch (err) {
          console.warn(`Failed to delete file ${p}:`, err.message);
        }
      }
    }
  }

  // 2. Delete brain directory for this session
  for (const bDir of BRAIN_DIRS) {
    const sessionBrain = path.join(bDir, cleanId);
    if (fs.existsSync(sessionBrain)) {
      try {
        const sz = getPathSize(sessionBrain);
        fs.rmSync(sessionBrain, { recursive: true, force: true });
        totalFreed += sz;
        deletedFiles.push(sessionBrain);
      } catch (err) {
        console.warn(`Failed to delete brain folder ${sessionBrain}:`, err.message);
      }
    }
  }

  return {
    success: deletedFiles.length > 0,
    freedBytes: totalFreed,
    freedFormatted: formatBytes(totalFreed),
    deletedFiles,
  };
}

/**
 * Deletes all sessions associated with a project
 * @param {Array<{ full_id: string }>} sessionItems list of sessions in the project
 * @returns {{ success: boolean, deletedSessionsCount: number, freedBytes: number, freedFormatted: string }}
 */
function deleteProjectSessions(sessionItems) {
  if (!Array.isArray(sessionItems) || sessionItems.length === 0) {
    return { success: false, deletedSessionsCount: 0, freedBytes: 0, freedFormatted: '0 B' };
  }

  let totalFreed = 0;
  let count = 0;

  for (const item of sessionItems) {
    const id = item.full_id || item.id;
    if (id) {
      const res = deleteSessionFiles(id);
      if (res.success) {
        count++;
        totalFreed += res.freedBytes;
      }
    }
  }

  return {
    success: count > 0,
    deletedSessionsCount: count,
    freedBytes: totalFreed,
    freedFormatted: formatBytes(totalFreed),
  };
}

module.exports = {
  deleteSessionFiles,
  deleteProjectSessions,
  formatBytes,
};
