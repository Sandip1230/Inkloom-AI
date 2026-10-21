const AuditEvent = require('../models/AuditEvent');
const Organization = require('../models/Organization');

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function purgeExpiredAuditEvents() {
  const organizations = await Organization.find().select('_id auditRetentionDays').lean();
  let deletedCount = 0;

  for (const organization of organizations) {
    const expiresBefore = new Date(Date.now() - organization.auditRetentionDays * 24 * 60 * 60 * 1000);
    const result = await AuditEvent.deleteMany({
      organizationId: organization._id,
      createdAt: { $lt: expiresBefore },
    });
    deletedCount += result.deletedCount;
  }

  return deletedCount;
}

function startAuditRetentionCleanup() {
  const run = () => {
    purgeExpiredAuditEvents()
      .then((deletedCount) => {
        if (deletedCount > 0) console.log(`Audit retention cleanup removed ${deletedCount} expired event(s).`);
      })
      .catch((error) => console.error('Audit retention cleanup failed:', error.message));
  };

  run();
  const timer = setInterval(run, CLEANUP_INTERVAL_MS);
  timer.unref();
  return timer;
}

module.exports = { purgeExpiredAuditEvents, startAuditRetentionCleanup };
