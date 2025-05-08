function formatTime(seconds) {
    const m = Math.floor(seconds/60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
  module.exports = { formatTime };