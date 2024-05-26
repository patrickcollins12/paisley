export const tokenLocalStageKey = 'paisley_jwt_token';

export function clearToken(withEvent = false) {
  const oldValue = getToken();
  localStorage.removeItem(tokenLocalStageKey);

  if (!withEvent) {
    return;
  }
  // we have to create a synthetic storage event so that React knows to clear
  // its internal state and log the user out. AuthContext listens for this event
  // and clears the current context when this specific event occurs.
  const e = new StorageEvent("storage", {
    storageArea: window.localStorage,
    key: tokenLocalStageKey,
    newValue: null,
    oldValue: oldValue
  });

  window.dispatchEvent(e);
}

export function getToken() {
  return localStorage.getItem(tokenLocalStageKey);
}

export function setToken(value) {
  localStorage.setItem(tokenLocalStageKey, value);
}