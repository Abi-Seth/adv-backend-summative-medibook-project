// Exactly 24 and exactly 48 hours both receive 50%. Half-cents round up.
function calculateRefund(amountPaid, noticeHours) {
  const cents = Math.round(Number(amountPaid) * 100);
  const rate = noticeHours > 48 ? 1 : noticeHours >= 24 ? 0.5 : 0;
  return Math.round(cents * rate) / 100;
}

module.exports = calculateRefund;
