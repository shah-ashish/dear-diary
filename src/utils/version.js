/**
 * version.js — App version management & update checking
 *
 * Checks the GitHub Releases API for a newer version.
 * This is the ONLY network call in the entire app.
 * Fails silently if offline or rate-limited.
 */

/** Current app version — bump this on each release tag */
export const APP_VERSION = '2.1.1'

/** GitHub repo path for release checking */
const GITHUB_REPO = 'shah-ashish/dear-diary'
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

/**
 * Check GitHub Releases for a newer version.
 * @returns {Promise<{hasUpdate: boolean, latestVersion: string, downloadUrl: string} | null>}
 *          Returns null if the check fails (offline, rate-limited, no releases).
 */
export async function checkForUpdate() {
  try {
    const controller = new AbortController()
    // Timeout after 5 seconds — don't block app startup
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(RELEASES_API, {
      signal: controller.signal,
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    const latestTag = data.tag_name || '' // e.g. "v1.0.1"
    const latestVersion = latestTag.replace(/^v/, '') // strip leading 'v'

    if (!latestVersion) return null

    const hasUpdate = isNewerVersion(latestVersion, APP_VERSION)

    // Find APK asset download URL, fallback to the release page
    const apkAsset = (data.assets || []).find(
      (a) => a.name?.endsWith('.apk')
    )
    const downloadUrl = apkAsset
      ? apkAsset.browser_download_url
      : data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`

    return { hasUpdate, latestVersion, downloadUrl }
  } catch {
    // Silently fail — user is offline, rate-limited, or API is unreachable
    return null
  }
}

/**
 * Simple semver comparison: is `a` newer than `b`?
 * Supports x.y.z format only.
 */
function isNewerVersion(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const va = pa[i] || 0
    const vb = pb[i] || 0
    if (va > vb) return true
    if (va < vb) return false
  }
  return false // equal
}
