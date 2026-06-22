// Maps Stellar / Horizon error codes to user-facing messages.
// The backend may surface Stellar SDK codes (lowercase, e.g. "tx_insufficient_fee")
// or custom backend codes (uppercase, e.g. "HORIZON_UNREACHABLE").

const STELLAR_STATUS_URL = "https://status.stellar.org";

const CODE_MAP = {
  // Stellar SDK result codes (Horizon envelope errors)
  tx_insufficient_fee: {
    message:
      "The Stellar network is congested and rejected the transaction fee. Please try again in a few minutes or use a higher transaction fee.",
    showStatus: true,
  },
  op_underfunded: {
    message:
      "Insufficient XLM balance. Please fund your wallet with enough XLM to cover the payment and transaction fee.",
    showStatus: false,
  },
  // Backend-defined codes
  HORIZON_UNREACHABLE: {
    message:
      "The Stellar network is temporarily unavailable. Please check the network status and try again later.",
    showStatus: true,
  },
  HORIZON_UNAVAILABLE: {
    message:
      "The Stellar network is temporarily unavailable. Please check the network status and try again later.",
    showStatus: true,
  },
  STELLAR_NETWORK_ERROR: {
    message:
      "A Stellar network error occurred. Please try again in a few minutes.",
    showStatus: true,
  },
};

// Fallback: search the error message string for known keywords when the code field is absent.
const KEYWORD_MAP = [
  { keyword: "tx_insufficient_fee", ref: "tx_insufficient_fee" },
  { keyword: "op_underfunded",      ref: "op_underfunded" },
  { keyword: "horizon",             ref: "HORIZON_UNREACHABLE" },
  { keyword: "network congestion",  ref: "tx_insufficient_fee" },
  { keyword: "unavailable",         ref: "HORIZON_UNREACHABLE" },
];

/**
 * Attempts to extract a Stellar-specific error from an Axios error.
 * Returns { message, stellarStatusUrl } if the error is Stellar-related,
 * or null if the caller should fall back to a generic message.
 */
export function parseStellarError(err) {
  const code    = err?.response?.data?.code    || "";
  const message = err?.response?.data?.error   || err?.message || "";

  const entry = CODE_MAP[code];
  if (entry) {
    return {
      message: entry.message,
      stellarStatusUrl: entry.showStatus ? STELLAR_STATUS_URL : null,
    };
  }

  const lower = message.toLowerCase();
  for (const { keyword, ref } of KEYWORD_MAP) {
    if (lower.includes(keyword)) {
      const fallback = CODE_MAP[ref];
      return {
        message: fallback.message,
        stellarStatusUrl: fallback.showStatus ? STELLAR_STATUS_URL : null,
      };
    }
  }

  return null;
}
