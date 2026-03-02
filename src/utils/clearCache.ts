// Utility to clear cached balance data from localStorage
export const clearBalanceCache = () => {
  if (typeof window === 'undefined') return;

  try {
    const persistRoot = localStorage.getItem('persist:root');
    if (persistRoot) {
      const parsed = JSON.parse(persistRoot);
      if (parsed.mt5) {
        const mt5Data = JSON.parse(parsed.mt5);
        // Clear accounts array completely
        mt5Data.accounts = [];
        mt5Data.totalBalance = 0;
        parsed.mt5 = JSON.stringify(mt5Data);
        localStorage.setItem('persist:root', JSON.stringify(parsed));
        return true;
      }
    }
  } catch (e) {
    console.error('❌ Failed to clear cache:', e);
    return false;
  }
  return false;
};
