import { promiseResultCache } from "../utils/promise-result-cache"
import type {
  AuthorizationProviderConfig,
} from "./types"

const PERMISSIONS_CACHE_KEY = "authorization/permissions"

/**
 * Default authorization provider:
 * - caches permissions in-memory (promiseCache)
 * - replace getPermissions with real API call in production
 */
const defaultAuthorizationProvider: AuthorizationProviderConfig = {
  getPermissions: async () => {
    return promiseResultCache(PERMISSIONS_CACHE_KEY, async () => {
      // 返回菜单树、授权控制点列表
      return {
        permissonPoints: [],
        menuTree: [],
      }
    })
  }
}

export { PERMISSIONS_CACHE_KEY }
export default defaultAuthorizationProvider
